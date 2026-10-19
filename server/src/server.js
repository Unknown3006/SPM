const dns = require('dns');
// Prefer IPv4 over IPv6 to avoid SMTP/network timeouts on ISPs
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(` Tourism Management System (TMS) API Server`);
      console.log(` Environment: ${env.NODE_ENV}`);
      console.log(` Port:        ${env.PORT}`);
      console.log(` API Base:    http://localhost:${env.PORT}/api/v1`);
      console.log(` Client URL:  ${env.CLIENT_URL}`);
      console.log(`===============================================`);
    });

    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] Closed remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[Server Start Error] ${error.message}`);
    process.exit(1);
  }
};

startServer();
