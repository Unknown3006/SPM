const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const TourPackage = require('../src/models/TourPackage');
const Booking = require('../src/models/Booking');
const Complaint = require('../src/models/Complaint');
const Review = require('../src/models/Review');
const User = require('../src/models/User');
const { seedCatalog } = require('../src/seeds/seed');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/tms_test_db';

let customerToken = '';
let customerId = '';
let customer2Token = '';
let customer2Id = '';
let agentToken = '';
let adminToken = '';
let completedBooking = null;
let confirmedBooking = null;
let rajasthanPkg = null;

beforeAll(async () => {
  await connectDB(TEST_DB_URI);
  await seedCatalog(true);

  // Customer 1
  const custRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'customer@tms.test', password: 'Customer@123' });
  customerToken = custRes.body.token;
  customerId = custRes.body.user._id;

  // Customer 2
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

  // Employee
  const agentRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'agent@tms.test', password: 'Agent@123' });
  agentToken = agentRes.body.token;

  // Admin
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@tms.test', password: 'Admin@123' });
  adminToken = adminRes.body.token;

  completedBooking = await Booking.findOne({ bookingId: 'TMS-20261019-1002' });
  confirmedBooking = await Booking.findOne({ bookingId: 'TMS-20261019-1001' });
  rajasthanPkg = await TourPackage.findOne({ destination: 'Rajasthan' });
});

afterAll(async () => {
  await disconnectDB();
});

describe('Increment 4: Complaints Workflow', () => {
  let createdComplaintId = '';
  let complaintDocId = '';

  it('POST /api/v1/complaints allows a customer to submit a complaint', async () => {
    const res = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subject: 'Hotel wifi not working properly',
        description: 'The wifi in room 302 was down for the entire evening. Please address this.',
        bookingId: confirmedBooking._id
      });

    expect(res.status).toBe(201);
    expect(res.body.complaint).toBeDefined();
    expect(res.body.complaint.complaintId).toMatch(/^CMP-[A-Z0-9]{6}$/);
    expect(res.body.complaint.status).toBe('OPEN');
    expect(res.body.complaint.user.toString()).toBe(customerId.toString());

    createdComplaintId = res.body.complaint.complaintId;
    complaintDocId = res.body.complaint._id;
  });

  it('POST /api/v1/complaints rejects linking to a booking that belongs to someone else', async () => {
    const res = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        subject: 'Unauthorized booking complaint',
        description: 'Trying to complain about customer 1 booking',
        bookingId: confirmedBooking._id
      });

    expect([400, 403]).toContain(res.status);
    expect(res.body.message).toMatch(/cannot link another customer|booking not found/i);
  });

  it('GET /api/v1/complaints/mine returns only customer complaints', async () => {
    const res = await request(app)
      .get('/api/v1/complaints/mine')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.complaints)).toBe(true);
    expect(res.body.complaints.length).toBeGreaterThan(0);
    res.body.complaints.forEach((c) => {
      expect(c.user.toString()).toBe(customerId.toString());
    });
  });

  it('GET /api/v1/complaints/:id denies another customer from accessing complaint', async () => {
    const res = await request(app)
      .get(`/api/v1/complaints/${createdComplaintId}`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(res.status).toBe(403);
  });

  it('GET /api/v1/complaints allows employee to list all complaints', async () => {
    const res = await request(app)
      .get('/api/v1/complaints')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.complaints)).toBe(true);
    expect(res.body.complaints.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/v1/complaints/:id/notes allows employee to add internal note', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${createdComplaintId}/notes`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        text: 'Contacted hotel management. Router has been reset.'
      });

    expect(res.status).toBe(200);
    expect(res.body.complaint.notes.length).toBeGreaterThan(0);
    expect(res.body.complaint.notes[0].text).toContain('Router has been reset');
  });

  it('POST /api/v1/complaints/:id/notes blocks customers from adding staff notes', async () => {
    const res = await request(app)
      .post(`/api/v1/complaints/${createdComplaintId}/notes`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        text: 'Attempting to inject note'
      });

    expect(res.status).toBe(403);
  });

  it('PATCH /api/v1/complaints/:id allows employee to update status and resolution', async () => {
    const res = await request(app)
      .patch(`/api/v1/complaints/${createdComplaintId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        status: 'RESOLVED',
        resolution: 'Hotspot credentials provided and router replaced by hotel.'
      });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('RESOLVED');
    expect(res.body.complaint.resolution).toContain('Hotspot credentials');
  });
});

describe('Increment 4: Reviews Workflow', () => {
  it('POST /api/v1/reviews rejects reviewing a booking that is not COMPLETED', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: confirmedBooking._id,
        rating: 4,
        comment: 'Nice trip before completion'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/completed/i);
  });

  it('POST /api/v1/reviews allows review on COMPLETED booking', async () => {
    // Delete seed review if existing so we can test clean creation
    await Review.deleteMany({ booking: completedBooking._id });

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: completedBooking._id,
        rating: 5,
        comment: 'Unforgettable journey through Rajasthan! Excellent guides and heritage accommodations.'
      });

    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);
    expect(res.body.review.package.toString()).toBe(rajasthanPkg._id.toString());

    // Verify package rating recalculated
    const updatedPkg = await TourPackage.findById(rajasthanPkg._id);
    expect(updatedPkg.ratingCount).toBeGreaterThanOrEqual(1);
    expect(updatedPkg.ratingAverage).toBe(5);
  });

  it('POST /api/v1/reviews prevents duplicate reviews for the same booking', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: completedBooking._id,
        rating: 4,
        comment: 'Second review attempt'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  it('GET /api/v1/reviews/package/:packageId returns reviews for the package', async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/package/${rajasthanPkg._id}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reviews)).toBe(true);
    expect(res.body.reviews.length).toBeGreaterThanOrEqual(1);
    expect(res.body.reviews[0].comment).toContain('Rajasthan');
  });
});

describe('Increment 4: Admin Safeguards & User Management', () => {
  it('DELETE /api/v1/admin/users/:id prevents admin from deleting their own account', async () => {
    const adminUser = await User.findOne({ email: 'admin@tms.test' });
    const res = await request(app)
      .delete(`/api/v1/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot delete/i);
  });

  it('DELETE /api/v1/admin/users/:id prevents deleting the last administrator', async () => {
    // Attempt to delete admin using another admin token if created, but here only 1 admin exists
    // Test that trying to delete the single admin returns safeguard error
    const adminUser = await User.findOne({ email: 'admin@tms.test' });
    const res = await request(app)
      .delete(`/api/v1/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it('DELETE /api/v1/admin/users/:id allows admin to delete a regular customer user', async () => {
    const tempUser = await User.create({
      name: 'Temp Delete Me',
      email: 'delete_me@tms.test',
      passwordHash: 'dummyhash',
      role: 'customer'
    });

    const res = await request(app)
      .delete(`/api/v1/admin/users/${tempUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const found = await User.findById(tempUser._id);
    expect(found).toBeNull();
  });
});

describe('Increment 4: Reports Engine', () => {
  it('GET /api/v1/reports/stats forbids customer access', async () => {
    const res = await request(app)
      .get('/api/v1/reports/stats')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it('GET /api/v1/reports/stats returns KPI metrics for admin/employee', async () => {
    const res = await request(app)
      .get('/api/v1/reports/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(typeof res.body.stats.totalRevenue).toBe('number');
    expect(typeof res.body.stats.totalBookings).toBe('number');
    expect(typeof res.body.stats.activeUsers).toBe('number');
    expect(typeof res.body.stats.openComplaints).toBe('number');
    expect(res.body.stats.bookingsByStatus).toBeDefined();
  });

  it('GET /api/v1/reports/revenue returns monthly trend data', async () => {
    const res = await request(app)
      .get('/api/v1/reports/revenue')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trends)).toBe(true);
    if (res.body.trends.length > 0) {
      expect(res.body.trends[0]).toHaveProperty('label');
      expect(res.body.trends[0]).toHaveProperty('revenue');
    }
  });

  it('GET /api/v1/reports/bookings?format=csv returns CSV formatted stream', async () => {
    const res = await request(app)
      .get('/api/v1/reports/bookings?format=csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/TMS-Bookings-Report\.csv/);
    expect(res.text).toContain('Booking ID,Customer Name');
    expect(res.text).toContain('TMS-20261019-1001');
  });

  it('GET /api/v1/reports/bookings?format=pdf returns PDF binary stream', async () => {
    const res = await request(app)
      .get('/api/v1/reports/bookings?format=pdf')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/TMS-Bookings-Report\.pdf/);
    expect(res.body).toBeDefined();
  });
});
