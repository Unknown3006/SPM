const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const TourPackage = require('../src/models/TourPackage');
const Hotel = require('../src/models/Hotel');
const TransportService = require('../src/models/TransportService');
const PromotionalOffer = require('../src/models/PromotionalOffer');
const { seedCatalog } = require('../src/seeds/seed');
const travelService = require('../src/services/providers/travelService');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/tms_test_db';

beforeAll(async () => {
  await connectDB(TEST_DB_URI);
  await seedCatalog(true); // Seed fresh test data
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
  }
});

describe('Catalog API - Tour Packages (/api/v1/packages)', () => {
  it('GET /api/v1/packages should return list of active packages with pagination metadata', async () => {
    const res = await request(app).get('/api/v1/packages?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.packages.length).toBeLessThanOrEqual(5);
    expect(res.body.total).toBeGreaterThanOrEqual(12);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/v1/packages?category=beach should return only beach category packages', async () => {
    const res = await request(app).get('/api/v1/packages?category=beach');
    expect(res.status).toBe(200);
    expect(res.body.packages.length).toBeGreaterThan(0);
    res.body.packages.forEach((pkg) => {
      expect(pkg.category).toBe('beach');
    });
  });

  it('GET /api/v1/packages?destination=Goa should filter packages by destination', async () => {
    const res = await request(app).get('/api/v1/packages?destination=Goa');
    expect(res.status).toBe(200);
    expect(res.body.packages.length).toBeGreaterThan(0);
    expect(res.body.packages[0].destination).toMatch(/Goa/i);
  });

  it('GET /api/v1/packages?minPrice=20000&maxPrice=30000 should filter within price range', async () => {
    const res = await request(app).get('/api/v1/packages?minPrice=20000&maxPrice=30000');
    expect(res.status).toBe(200);
    res.body.packages.forEach((pkg) => {
      expect(pkg.price).toBeGreaterThanOrEqual(20000);
      expect(pkg.price).toBeLessThanOrEqual(30000);
    });
  });

  it('GET /api/v1/packages?sortBy=price_asc should return packages sorted by price ascending', async () => {
    const res = await request(app).get('/api/v1/packages?sortBy=price_asc');
    expect(res.status).toBe(200);
    const prices = res.body.packages.map((p) => p.price);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
    }
  });

  it('GET /api/v1/packages/:id should return complete package details with itinerary', async () => {
    const all = await TourPackage.find({ isActive: true }).limit(1);
    const sampleId = all[0]._id.toString();

    const res = await request(app).get(`/api/v1/packages/${sampleId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.package._id).toBe(sampleId);
    expect(Array.isArray(res.body.package.itinerary)).toBe(true);
    expect(Array.isArray(res.body.package.inclusions)).toBe(true);
    expect(Array.isArray(res.body.package.availableDates)).toBe(true);
  });

  it('GET /api/v1/packages/invalid-id should return 404', async () => {
    const res = await request(app).get('/api/v1/packages/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Catalog API - Hotels & Transport (/api/v1/hotels, /api/v1/transport)', () => {
  it('GET /api/v1/hotels should return list of hotels with provider metadata', async () => {
    const res = await request(app).get('/api/v1/hotels');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hotels.length).toBeGreaterThanOrEqual(10);
    expect(res.body.provider).toBeDefined();
  });

  it('GET /api/v1/hotels?city=Goa should filter hotels by city', async () => {
    const res = await request(app).get('/api/v1/hotels?city=Goa');
    expect(res.status).toBe(200);
    expect(res.body.hotels.length).toBeGreaterThan(0);
    expect(res.body.hotels[0].city).toMatch(/Goa/i);
  });

  it('GET /api/v1/transport?type=flight should filter transport services by type', async () => {
    const res = await request(app).get('/api/v1/transport?type=flight');
    expect(res.status).toBe(200);
    expect(res.body.transport.length).toBeGreaterThan(0);
    res.body.transport.forEach((t) => {
      expect(t.type).toBe('flight');
    });
  });

  it('GET /api/v1/transport?from=Delhi&to=Goa should filter by route', async () => {
    const res = await request(app).get('/api/v1/transport?from=Delhi&to=Goa');
    expect(res.status).toBe(200);
    expect(res.body.transport.length).toBeGreaterThan(0);
    expect(res.body.transport[0].from).toMatch(/Delhi/i);
    expect(res.body.transport[0].to).toMatch(/Goa/i);
  });
});

describe('Promotional Offers API (/api/v1/offers)', () => {
  it('GET /api/v1/offers/active should return only currently unexpired active offers', async () => {
    const res = await request(app).get('/api/v1/offers/active');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const codes = res.body.offers.map((o) => o.code);
    expect(codes).toContain('WELCOME10');
    expect(codes).toContain('FLAT500');
    expect(codes).not.toContain('EXPIRED50'); // Expired offer must NOT be in active list
  });

  it('POST /api/v1/offers/validate should calculate percent discount with max cap', async () => {
    // WELCOME10: 10% up to ₹2,000, min ₹5,000
    // On ₹30,000: 10% is ₹3,000, but capped at ₹2,000. Tax 5% on ₹28,000 = ₹1,400. Total = ₹29,400.
    const res = await request(app)
      .post('/api/v1/offers/validate')
      .send({ code: 'WELCOME10', amount: 30000 });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.breakdown.discount).toBe(2000); // Max discount cap enforced!
    expect(res.body.breakdown.discountedAmount).toBe(28000);
    expect(res.body.breakdown.tax).toBe(1400); // 5% tax
    expect(res.body.breakdown.total).toBe(29400);
  });

  it('POST /api/v1/offers/validate should calculate flat discount', async () => {
    // FLAT500 on ₹10,000
    const res = await request(app)
      .post('/api/v1/offers/validate')
      .send({ code: 'FLAT500', amount: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.breakdown.discount).toBe(500);
    expect(res.body.breakdown.discountedAmount).toBe(9500);
    expect(res.body.breakdown.tax).toBe(475);
    expect(res.body.breakdown.total).toBe(9975);
  });

  it('POST /api/v1/offers/validate should reject expired offer', async () => {
    const res = await request(app)
      .post('/api/v1/offers/validate')
      .send({ code: 'EXPIRED50', amount: 5000 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('POST /api/v1/offers/validate should reject order below minAmount', async () => {
    // WELCOME10 requires min ₹5,000
    const res = await request(app)
      .post('/api/v1/offers/validate')
      .send({ code: 'WELCOME10', amount: 2000 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/minimum/i);
  });
});

describe('Travel Provider Abstraction & Fallback Simulation', () => {
  afterEach(() => {
    travelService.setSimulateFailure(false);
  });

  it('GET /api/v1/providers/status should return simulation state', async () => {
    const res = await request(app).get('/api/v1/providers/status');
    expect(res.status).toBe(200);
    expect(res.body.providerName).toBeDefined();
    expect(res.body.simulateFailure).toBe(false);
  });

  it('When external provider fails, TravelService must gracefully fallback to LocalProvider', async () => {
    // Enable simulated external provider failure
    travelService.setSimulateFailure(true);

    // Call hotels with preferExternal=true (triggers simulated failure)
    const res = await request(app).get('/api/v1/hotels?preferExternal=true');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fallbackUsed).toBe(true); // Fallback was engaged!
    expect(res.body.fallbackNotice).toMatch(/temporarily unavailable/i);
    expect(res.body.hotels.length).toBeGreaterThan(0); // Returned local hotels!
  });
});
