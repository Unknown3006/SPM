const NotificationLog = require('../models/NotificationLog');

/**
 * SMS Service abstraction
 * Logs to console and saves an entry in NotificationLog collection.
 * Can be swapped for a real provider (Twilio, AWS SNS, Fast2SMS) by changing the transport.
 */
const sendSMS = async ({ to, message, eventType = 'NOTIFICATION', userId = null }) => {
  let status = 'SENT';
  let errorMsg = null;

  try {
    console.log(`[smsService] SMS to ${to}: ${message}`);
  } catch (err) {
    status = 'FAILED';
    errorMsg = err.message;
  }

  try {
    await NotificationLog.create({
      user: userId,
      channel: 'SMS',
      eventType,
      recipient: to,
      subject: 'SMS Notification',
      body: message,
      status,
      error: errorMsg
    });
  } catch (logErr) {
    console.error(`[NotificationLog Error] ${logErr.message}`);
  }

  return { success: status === 'SENT', error: errorMsg };
};

module.exports = { sendSMS };
