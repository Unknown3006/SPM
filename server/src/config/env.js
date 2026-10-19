const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tms_db',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret_tms_jwt_key_development_only_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'ethereal',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '"Tourism Management System" <no-reply@tms.test>',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'mock',
  SIMULATE_PROVIDER_FAILURE: process.env.SIMULATE_PROVIDER_FAILURE === 'true'
};
