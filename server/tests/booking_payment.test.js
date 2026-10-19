const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const TourPackage = require('../src/models/TourPackage');
const Hotel = require('../src/models/Hotel');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const User = require('../src/models/User');
const { seedCatalog } = require('../src/seeds/seed');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/tms_test_db';

let customerToken = '';
let customerId = '';
let customer2Token = '';
let customer2Id = '';
let agentToken = '';
let adminToken = '';
let samplePackage = null;
let sampleDate = null;

beforeAll(async () => {
  await connectDB(TEST_DB_URI);
  await seedCatalog(true);

  // Login primary customer
  const custRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'customer@tms.test', password: 'Customer@123' });
  customerToken = custRes.body.token;
  customerId = custRes.body.user._id;

  // Create & login a second customer for ownership tests
  const cust2Res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Second Customer',
      email: 'customer2@tms.test',
      password: 'Customer2@123',
      phone: '+91 9988776655'
    });
  customer2Token = cust2Res.body.token;
  customer2Id = cust2Res.body.user._id;

  // Login employee
  const agentRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'agent@tms.test', password: 'Agent@123' });
  agentToken = agentRes.body.token;

  // Login admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@tms.test', password: 'Admin@123' });
  adminToken = adminRes.body.token;

  samplePackage = await TourPackage.findOne({ destination: 'Goa' });
  sampleDate = samplePackage.availableDates[0].date;
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
  }
});

describe('Booking & Pricing Engine API (/api/v1/bookings)', () => {
  it('POST /api/v1/bookings should create booking and recompute price strictly on server with 5% tax', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        itemType: 'package',
        itemId: samplePackage._id,
        travelDate: sampleDate,
        travellers: [
          { name: 'Traveler One', age: 28, gender: 'male' },
          { name: 'Traveler Two', age: 26, gender: 'female' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.bookingId).toMatch(/^TMS-\d{8}-\d{4}$/);
    expect(res.body.booking.status).toBe('PENDING_PAYMENT');

    const expectedBase = samplePackage.price * 2;
    const expectedTax = Math.round(expectedBase * 0.05 * 100) / 100;
    const expectedTotal = expectedBase + expectedTax;

    expect(res.body.priceBreakdown.basePrice).toBe(expectedBase);
    expect(res.body.priceBreakdown.discount).toBe(0);
    expect(res.body.priceBreakdown.taxes).toBe(expectedTax);
    expect(res.body.priceBreakdown.total).toBe(expectedTotal);
  });

  it('POST /api/v1/bookings with PERCENT offer (WELCOME10) should apply 10% discount capped at ₹2,000', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        itemType: 'package',
        itemId: samplePackage._id,
        travelDate: sampleDate,
        offerCode: 'WELCOME10',
        travellers: [
          { name: 'Alice', age: 30, gender: 'female' },
          { name: 'Bob', age: 32, gender: 'male' }
        ]
      });

    expect(res.status).toBe(201);
    const base = samplePackage.price * 2;
    const rawDiscount = Math.round((base * 10) / 100);
    const expectedDiscount = Math.min(rawDiscount, 2000); // capped at 2000
    const taxable = base - expectedDiscount;
    const expectedTax = Math.round(taxable * 0.05 * 100) / 100;
    const expectedTotal = taxable + expectedTax;

    expect(res.body.priceBreakdown.discount).toBe(expectedDiscount);
    expect(res.body.priceBreakdown.total).toBe(expectedTotal);
    expect(res.body.booking.appliedOfferCode).toBe('WELCOME10');
  });

  it('POST /api/v1/bookings with FLAT offer (FLAT500) should apply ₹500 off if minAmount met', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        itemType: 'package',
        itemId: samplePackage._id,
        travelDate: sampleDate,
        offerCode: 'FLAT500',
        travellers: [{ name: 'Solo Traveller', age: 35, gender: 'other' }]
      });

    expect(res.status).toBe(201);
    const base = samplePackage.price;
    const expectedDiscount = 500;
    const taxable = base - expectedDiscount;
    const expectedTax = Math.round(taxable * 0.05 * 100) / 100;
    const expectedTotal = taxable + expectedTax;

    expect(res.body.priceBreakdown.discount).toBe(expectedDiscount);
    expect(res.body.priceBreakdown.total).toBe(expectedTotal);
  });

  it('POST /api/v1/bookings with EXPIRED offer should give 0 discount without crashing', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        itemType: 'package',
        itemId: samplePackage._id,
        travelDate: sampleDate,
        offerCode: 'EXPIRED50',
        travellers: [{ name: 'Test User', age: 25, gender: 'male' }]
      });

    expect(res.status).toBe(201);
    expect(res.body.priceBreakdown.discount).toBe(0);
    expect(res.body.booking.appliedOfferCode).toBeNull();
  });

  it('POST /api/v1/bookings should reject if requested seats exceed available seats', async () => {
    const hugeTravellers = Array.from({ length: 50 }, (_, i) => ({
      name: `Person ${i}`,
      age: 20,
      gender: 'male'
    }));

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        itemType: 'package',
        itemId: samplePackage._id,
        travelDate: sampleDate,
        travellers: hugeTravellers
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/remaining|available|seat/i);
  });
});

describe('Ownership & Access Control for Bookings', () => {
  let cust1Booking = null;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        itemType: 'package',
        itemId: samplePackage._id,
        travelDate: sampleDate,
        travellers: [{ name: 'Owner Cust1', age: 30, gender: 'male' }]
      });
    cust1Booking = res.body.booking;
  });

  it('GET /api/v1/bookings/:id allows the owner customer to view their booking', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${cust1Booking.bookingId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.bookingId).toBe(cust1Booking.bookingId);
  });

  it('GET /api/v1/bookings/:id BLOCKS second customer with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${cust1Booking.bookingId}`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized|access denied/i);
  });

  it('POST /api/v1/bookings/:id/cancel BLOCKS second customer from cancelling another user booking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${cust1Booking.bookingId}/cancel`)
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ reason: 'Malicious attempt' });

    expect(res.status).toBe(403);
  });
});

describe('Payment Engine & Idempotency (/api/v1/payments)', () => {
  let pendingBooking = null;
  const mockPaymentId = `pay_mock_test_${Date.now()}`;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        itemType: 'package',
        itemId: samplePackage._id,
        travelDate: sampleDate,
        travellers: [{ name: 'Payer Guy', age: 31, gender: 'male' }]
      });
    if (!res.body.success) {
      console.error('[TEST ERROR in pendingBooking creation]', res.status, res.body);
    }
    pendingBooking = res.body.booking;
  });

  it('POST /api/v1/payments/create-order creates gateway order for pending booking', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId: pendingBooking.bookingId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.orderId).toMatch(/^order_mock_/);
  });

  it('POST /api/v1/payments/verify with simulateSuccess=false records failure and leaves booking unconfirmed', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: pendingBooking.bookingId,
        orderId: 'order_mock_test_fail',
        simulateSuccess: false,
        failureReason: 'Insufficient balance'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.payment.status).toBe('FAILED');

    // Verify booking is still pending
    const check = await Booking.findById(pendingBooking._id);
    expect(check.status).toBe('PENDING_PAYMENT');
  });

  it('POST /api/v1/payments/verify with success confirms booking and creates invoice', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: pendingBooking.bookingId,
        orderId: 'order_mock_test_success',
        paymentId: mockPaymentId,
        method: 'CARD',
        simulateSuccess: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.status).toBe('CONFIRMED');
    expect(res.body.payment.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(res.body.payment.status).toBe('SUCCESS');
  });

  it('IDEMPOTENCY: Calling /payments/verify a second time with the SAME paymentId must NOT double-confirm or duplicate invoice', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: pendingBooking.bookingId,
        orderId: 'order_mock_test_success',
        paymentId: mockPaymentId, // exact same ID
        method: 'CARD',
        simulateSuccess: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.idempotent).toBe(true);

    // Verify that only ONE successful payment record exists for this paymentId
    const count = await Payment.countDocuments({ gatewayPaymentId: mockPaymentId });
    expect(count).toBe(1);
  });

  it('GET /api/v1/payments/:id/invoice downloads valid PDF invoice for booking owner', async () => {
    const res = await request(app)
      .get(`/api/v1/payments/${pendingBooking.bookingId}/invoice`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="Invoice-/);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/payments/:id/invoice BLOCKS non-owner customer with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/v1/payments/${pendingBooking.bookingId}/invoice`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(res.status).toBe(403);
  });
});

describe('Cancellation & Refund Tiers (/api/v1/bookings/:id/cancel)', () => {
  let earlyBooking = null; // >= 7 days -> 90%
  let midBooking = null;   // 3-6 days -> 50%
  let lateBooking = null;  // < 3 days -> 0%

  beforeAll(async () => {
    // Helper to create & confirm booking with given travel date
    const createConfirmedBooking = async (daysAhead) => {
      const travelDate = new Date();
      travelDate.setDate(travelDate.getDate() + daysAhead);

      const bRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          itemType: 'package',
          itemId: samplePackage._id,
          travelDate,
          travellers: [{ name: 'Refund Tester', age: 30, gender: 'male' }]
        });

      if (!bRes.body.success) {
        console.error('[TEST ERROR in createConfirmedBooking]', bRes.status, bRes.body);
      }
      const b = bRes.body.booking;

      await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: b.bookingId,
          orderId: `order_rfnd_${daysAhead}`,
          paymentId: `pay_rfnd_${daysAhead}_${Date.now()}`,
          simulateSuccess: true
        });

      return Booking.findById(b._id);
    };

    earlyBooking = await createConfirmedBooking(10); // 10 days ahead
    midBooking = await createConfirmedBooking(4);    // 4 days ahead
    lateBooking = await createConfirmedBooking(1);   // 1 day ahead
  });

  it('Cancel Preview for >= 7 days ahead calculates 90% refund', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${earlyBooking.bookingId}/cancel-preview`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.preview.refundPercentage).toBe(90);
    expect(res.body.preview.refundAmount).toBe(
      Math.round((earlyBooking.priceBreakdown.total * 90) / 100)
    );
  });

  it('Cancel Preview for 3 to 6 days ahead calculates 50% refund', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${midBooking.bookingId}/cancel-preview`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.preview.refundPercentage).toBe(50);
  });

  it('Cancel Preview for < 3 days ahead calculates 0% refund', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${lateBooking.bookingId}/cancel-preview`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.preview.refundPercentage).toBe(0);
    expect(res.body.preview.refundAmount).toBe(0);
  });

  it('POST /api/v1/bookings/:id/cancel executes cancellation, creates REFUNDED payment record, and updates status', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${earlyBooking.bookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Vacation plan rescheduled' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.status).toBe('CANCELLED');
    expect(res.body.booking.cancellation.refundPercentage).toBe(90);
    expect(res.body.refund.refundAmount).toBeGreaterThan(0);

    // Verify refund payment record exists
    const refundPayment = await Payment.findOne({
      booking: earlyBooking._id,
      status: 'REFUNDED'
    });
    expect(refundPayment).toBeTruthy();
    expect(refundPayment.amount).toBe(res.body.refund.refundAmount);
  });

  it('PATCH /api/v1/bookings/:id/hide soft-hides cancelled booking from customer view but retains it for admin', async () => {
    const hideRes = await request(app)
      .patch(`/api/v1/bookings/${earlyBooking.bookingId}/hide`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(hideRes.status).toBe(200);

    // Customer personal list should omit it by default
    const custList = await request(app)
      .get('/api/v1/bookings/mine')
      .set('Authorization', `Bearer ${customerToken}`);

    const foundInCust = custList.body.bookings.find(
      (b) => b.bookingId === earlyBooking.bookingId
    );
    expect(foundInCust).toBeUndefined();

    // Admin should STILL see it in the complete bookings table
    const adminList = await request(app)
      .get(`/api/v1/bookings?search=${earlyBooking.bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminList.status).toBe(200);
    expect(adminList.body.bookings.length).toBe(1);
    expect(adminList.body.bookings[0].bookingId).toBe(earlyBooking.bookingId);
  });
});
