const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/tms_test_db';

beforeAll(async () => {
  await connectDB(TEST_DB_URI);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await disconnectDB();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Health and System Check', () => {
  it('GET /api/v1/health should return 200 and system status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('TMS API is active');
    expect(res.body.database).toBe('connected');
  });
});

describe('Authentication API (/api/v1/auth)', () => {
  const customerUser = {
    name: 'Test Customer',
    email: 'customer.test@example.com',
    password: 'Password@123',
    phone: '+91 9999988888'
  };

  it('POST /api/v1/auth/register should create a customer and return JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(customerUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user.email).toBe(customerUser.email.toLowerCase());
    expect(res.body.user.passwordHash).toBeUndefined(); // Never return password hash
  });

  it('POST /api/v1/auth/register should reject duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(customerUser);
    const res = await request(app).post('/api/v1/auth/register').send(customerUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('POST /api/v1/auth/login should authenticate valid user', async () => {
    await request(app).post('/api/v1/auth/register').send(customerUser);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: customerUser.email,
      password: customerUser.password
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe(customerUser.name);
  });

  it('POST /api/v1/auth/login should reject invalid password', async () => {
    await request(app).post('/api/v1/auth/register').send(customerUser);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: customerUser.email,
      password: 'WrongPassword'
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should reject deactivated account', async () => {
    const passwordHash = await User.hashPassword('Secret@123');
    await User.create({
      name: 'Blocked User',
      email: 'blocked@test.com',
      passwordHash,
      role: 'customer',
      isActive: false
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'blocked@test.com',
      password: 'Secret@123'
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('GET /api/v1/auth/me should return logged in profile with valid JWT', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(customerUser);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(customerUser.email);
  });

  it('GET /api/v1/auth/me should reject request without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('RBAC Authorization & Security', () => {
  it('Customer calling an admin route should receive 403 Forbidden', async () => {
    // Register customer
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Regular Customer',
      email: 'reg.customer@test.com',
      password: 'Password@123'
    });
    const customerToken = regRes.body.token;

    // Customer tries to call admin user list
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  it('Admin calling admin route should succeed with 200', async () => {
    // Create admin user
    const passwordHash = await User.hashPassword('Admin@123');
    const admin = await User.create({
      name: 'Master Admin',
      email: 'admin.rbac@test.com',
      passwordHash,
      role: 'admin',
      isActive: true
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.rbac@test.com',
      password: 'Admin@123'
    });
    const adminToken = loginRes.body.token;

    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('Deactivated user token should be blocked by protect middleware', async () => {
    // Create user and get token
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Soon Deactivated',
      email: 'deactivate.me@test.com',
      password: 'Password@123'
    });
    const token = regRes.body.token;
    const userId = regRes.body.user._id;

    // Admin deactivates this user in DB
    await User.findByIdAndUpdate(userId, { isActive: false });

    // User attempts to use their still-unexpired token
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

describe('Password Reset Flow', () => {
  it('Should generate reset token and allow password reset', async () => {
    // Create user
    await request(app).post('/api/v1/auth/register').send({
      name: 'Reset Test',
      email: 'reset.flow@test.com',
      password: 'OldPassword@123',
      phone: '+91 9999900000'
    });

    // Request forgot password
    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'reset.flow@test.com'
    });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.debugResetToken).toBeDefined();

    const rawToken = forgotRes.body.debugResetToken;

    // Reset password using the raw token
    const resetRes = await request(app)
      .post(`/api/v1/auth/reset-password/${rawToken}`)
      .send({
        password: 'NewSuperPassword@123'
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify login with old password fails
    const oldLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'reset.flow@test.com',
      password: 'OldPassword@123'
    });
    expect(oldLogin.status).toBe(401);

    // Verify login with new password succeeds
    const newLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'reset.flow@test.com',
      password: 'NewSuperPassword@123'
    });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.token).toBeDefined();
  });
});
