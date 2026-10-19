const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS'],
      required: true
    },
    eventType: {
      type: String,
      required: true
    },
    recipient: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      default: ''
    },
    body: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED'],
      default: 'SENT'
    },
    error: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
