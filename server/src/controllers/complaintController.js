const crypto = require('crypto');
const Complaint = require('../models/Complaint');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

/**
 * Generate human-friendly Complaint ID: CMP-XXXXXX
 */
const generateComplaintId = () => {
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CMP-${randomSuffix}`;
};

/**
 * POST /api/v1/complaints
 * Create a new complaint (Customer)
 */
const createComplaint = async (req, res, next) => {
  try {
    const { subject, description, bookingId } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    let bookingRef = null;
    if (bookingId) {
      const query = bookingId.startsWith('TMS-') ? { bookingId } : { _id: bookingId };
      const booking = await Booking.findOne(query);

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Referenced booking not found' });
      }

      // Customer can only link their own booking
      if (
        req.user.role === 'customer' &&
        booking.user.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot link another customer’s booking'
        });
      }

      bookingRef = booking._id;
    }

    let complaintId = generateComplaintId();
    while (await Complaint.findOne({ complaintId })) {
      complaintId = generateComplaintId();
    }

    const complaint = await Complaint.create({
      complaintId,
      user: req.user._id,
      booking: bookingRef,
      subject,
      description,
      status: 'OPEN'
    });

    // Notify customer
    sendEmail({
      to: req.user.email,
      subject: `Complaint Registered - ${complaintId}`,
      text: `Your complaint ${complaintId} regarding "${subject}" has been registered. Our support team will review and respond promptly.`,
      eventType: 'COMPLAINT_CREATED',
      userId: req.user._id
    }).catch((err) => console.error(`[Email Error] ${err.message}`));

    // Alert employees
    sendEmail({
      to: 'agent@tms.test',
      subject: `[Internal Alert] New Customer Complaint: ${complaintId}`,
      text: `Customer ${req.user.name} submitted a new complaint ${complaintId}: "${subject}". Please review the queue.`,
      eventType: 'NEW_COMPLAINT_ALERT'
    }).catch((err) => console.error(`[Employee Alert Error] ${err.message}`));

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints/mine
 * List complaints of logged-in customer
 */
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .populate('booking', 'bookingId travelDate priceBreakdown')
      .populate('notes.author', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints/:id
 * Retrieve complaint details
 */
const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('CMP-') ? { complaintId: id } : { _id: id };

    const complaint = await Complaint.findOne(query)
      .populate('user', 'name email phone')
      .populate('booking')
      .populate('assignedTo', 'name email')
      .populate('notes.author', 'name role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Ownership check: Customer can only view their own
    if (
      req.user.role === 'customer' &&
      complaint.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view this complaint'
      });
    }

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints (Employee & Admin)
 * List all complaints with filtering and pagination
 */
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('user', 'name email phone')
        .populate('assignedTo', 'name email')
        .populate('booking', 'bookingId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Complaint.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      complaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/complaints/:id (Employee & Admin)
 * Update complaint status, assign agent, or set resolution
 */
const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolution } = req.body;

    const query = id.startsWith('CMP-') ? { complaintId: id } : { _id: id };
    const complaint = await Complaint.findOne(query).populate('user');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const previousStatus = complaint.status;

    if (status) complaint.status = status;
    if (assignedTo !== undefined) complaint.assignedTo = assignedTo || null;
    if (resolution !== undefined) complaint.resolution = resolution;

    await complaint.save();

    // If status changed, notify customer
    if (status && status !== previousStatus && complaint.user) {
      sendEmail({
        to: complaint.user.email,
        subject: `Complaint Status Updated - ${complaint.complaintId} [${status}]`,
        text: `Your complaint ${complaint.complaintId} status has been updated to "${status}". ${
          resolution ? `Resolution: ${resolution}` : ''
        }`,
        eventType: 'COMPLAINT_STATUS_CHANGED',
        userId: complaint.user._id
      }).catch((err) => console.error(`[Email Error] ${err.message}`));

      if (complaint.user.phone) {
        sendSMS({
          to: complaint.user.phone,
          message: `TMS: Complaint ${complaint.complaintId} status changed to ${status}.`,
          eventType: 'COMPLAINT_STATUS_CHANGED',
          userId: complaint.user._id
        }).catch((err) => console.error(`[SMS Error] ${err.message}`));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/complaints/:id/notes (Employee & Admin)
 * Add note to complaint thread
 */
const addComplaintNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    const query = id.startsWith('CMP-') ? { complaintId: id } : { _id: id };
    const complaint = await Complaint.findOne(query);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.notes.push({
      author: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    });

    await complaint.save();
    await complaint.populate('notes.author', 'name role');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      complaint,
      notes: complaint.notes
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaint,
  addComplaintNote
};
