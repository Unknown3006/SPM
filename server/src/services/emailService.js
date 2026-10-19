const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const nodemailer = require('nodemailer');
const env = require('../config/env');
const NotificationLog = require('../models/NotificationLog');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.NODE_ENV === 'test') {
    transporter = {
      sendMail: async (options) => {
        return { messageId: `test-${Date.now()}` };
      }
    };
    return transporter;
  }

  if (env.EMAIL_USER && env.EMAIL_PASS) {
    const cleanPass = env.EMAIL_PASS ? String(env.EMAIL_PASS).replace(/\s+/g, '') : '';
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(env.EMAIL_PORT) || 465,
      secure: Number(env.EMAIL_PORT) === 465,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: env.EMAIL_USER,
        pass: cleanPass
      }
    });
    console.log(`[EmailService] Configured SMTP for ${env.EMAIL_USER} on ${env.EMAIL_HOST}:${env.EMAIL_PORT} (IPv4 preferred)`);
  } else {
    // Development fallback: ethereal or test transport
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[EmailService] Ethereal test account created: ${testAccount.user}`);
    } catch (err) {
      // Direct console logger transporter if offline
      transporter = {
        sendMail: async (options) => {
          console.log(`[EmailService - Console Fallback] To: ${options.to} | Subject: ${options.subject}\nBody: ${options.text || options.html}`);
          return { messageId: `console-${Date.now()}` };
        }
      };
    }
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text, html, eventType = 'NOTIFICATION', userId = null }) => {
  let status = 'SENT';
  let errorMsg = null;

  try {
    const mailer = await getTransporter();
    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject,
      text: text || '',
      html: html || text || ''
    };

    const info = await mailer.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl && info && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[EmailService] Preview URL: ${previewUrl}`);
      }
    }
    console.log(`[EmailService] Email sent to: ${to} | Subject: ${subject}`);
  } catch (err) {
    status = 'FAILED';
    errorMsg = err.message;
    console.error(`[EmailService Error] Failed to send email to ${to}: ${err.message}`);
  }

  // Always log to NotificationLog
  try {
    await NotificationLog.create({
      user: userId,
      channel: 'EMAIL',
      eventType,
      recipient: to,
      subject,
      body: text || html || '',
      status,
      error: errorMsg
    });
  } catch (logErr) {
    console.error(`[NotificationLog Error] ${logErr.message}`);
  }

  return { success: status === 'SENT', error: errorMsg };
};

module.exports = { sendEmail };
