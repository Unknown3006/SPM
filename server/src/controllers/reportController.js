const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const TourPackage = require('../models/TourPackage');

/**
 * GET /api/v1/reports/stats
 * Summary statistics for Admin & Employee dashboard
 */
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBookings,
      totalComplaints,
      openComplaints,
      bookingStatusCounts,
      complaintStatusCounts,
      revenueResult,
      topPackages
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Booking.countDocuments(),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'OPEN' }),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ]),
      Booking.aggregate([
        { $match: { itemType: 'package', package: { $ne: null } } },
        { $group: { _id: '$package', count: { $sum: 1 }, totalRevenue: { $sum: '$priceBreakdown.total' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'tourpackages',
            localField: '_id',
            foreignField: '_id',
            as: 'packageDetails'
          }
        },
        { $unwind: '$packageDetails' },
        {
          $project: {
            destination: '$packageDetails.destination',
            title: '$packageDetails.title',
            count: 1,
            totalRevenue: 1
          }
        }
      ])
    ]);

    // Format status maps
    const bookingsByStatus = {
      CONFIRMED: 0,
      PENDING_PAYMENT: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };
    bookingStatusCounts.forEach((b) => {
      if (b._id) bookingsByStatus[b._id] = b.count;
    });

    const complaintsByStatus = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    };
    complaintStatusCounts.forEach((c) => {
      if (c._id) complaintsByStatus[c._id] = c.count;
    });

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers: totalUsers,
        totalBookings,
        totalRevenue,
        totalComplaints,
        openComplaints,
        bookingsByStatus,
        complaintsByStatus,
        topDestinations: topPackages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/revenue
 * Aggregated revenue trends for chart visualization
 */
const getRevenueTrend = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    const dateFormat = period === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const trends = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          label: '$_id',
          revenue: 1,
          transactions: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      period,
      trends,
      revenueTrend: trends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/bookings
 * Filter bookings report and export as JSON, CSV, or PDF
 */
const getBookingsReport = async (req, res, next) => {
  try {
    const { status, startDate, endDate, format = 'json' } = req.query;
    const query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('package', 'title destination')
      .populate('hotel', 'name city')
      .populate('transport', 'operator from to')
      .sort({ createdAt: -1 });

    // Format: CSV Export
    if (format === 'csv') {
      const headers = [
        'Booking ID',
        'Customer Name',
        'Customer Email',
        'Item Type',
        'Item Title',
        'Travel Date',
        'Travellers',
        'Base Price (INR)',
        'Discount (INR)',
        'Taxes (INR)',
        'Total (INR)',
        'Status',
        'Applied Offer',
        'Created At'
      ];

      const csvRows = [headers.join(',')];

      bookings.forEach((b) => {
        let itemTitle = 'Travel Item';
        if (b.package) itemTitle = b.package.title;
        else if (b.hotel) itemTitle = b.hotel.name;
        else if (b.transport) itemTitle = `${b.transport.operator} (${b.transport.from}-${b.transport.to})`;

        const row = [
          `"${b.bookingId}"`,
          `"${b.user?.name || 'Customer'}"`,
          `"${b.user?.email || ''}"`,
          `"${b.itemType}"`,
          `"${itemTitle.replace(/"/g, '""')}"`,
          `"${b.travelDate ? new Date(b.travelDate).toISOString().split('T')[0] : ''}"`,
          b.numberOfTravellers,
          b.priceBreakdown?.basePrice || 0,
          b.priceBreakdown?.discount || 0,
          b.priceBreakdown?.taxes || 0,
          b.priceBreakdown?.total || 0,
          `"${b.status}"`,
          `"${b.appliedOfferCode || 'NONE'}"`,
          `"${new Date(b.createdAt).toISOString().split('T')[0]}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="TMS-Bookings-Report.csv"');
      return res.status(200).send(csvContent);
    }

    // Format: PDF Export
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="TMS-Bookings-Report.pdf"');
        res.setHeader('Content-Length', pdfData.length);
        res.end(pdfData);
      });

      // Header Brand
      doc.fillColor('#0284c7').fontSize(20).text('Tourism Management System (TMS)', 40, 40, { bold: true });
      doc.fillColor('#64748b').fontSize(10).text('Executive Bookings & Revenue Report', 40, 68);

      const reportDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      doc.text(`Generated On: ${reportDate}`, 400, 68, { align: 'right' });

      doc.moveTo(40, 90).lineTo(555, 90).strokeColor('#cbd5e1').stroke();

      // Summary Metric Cards
      const totalRevenue = bookings
        .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.priceBreakdown?.total || 0), 0);

      doc.rect(40, 105, 160, 45).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#64748b').fontSize(8).text('TOTAL BOOKINGS', 50, 115);
      doc.fillColor('#0f172a').fontSize(14).text(`${bookings.length}`, 50, 128, { bold: true });

      doc.rect(215, 105, 160, 45).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor('#166534').fontSize(8).text('CONFIRMED REVENUE', 225, 115);
      doc.fillColor('#15803d').fontSize(14).text(`₹${totalRevenue.toLocaleString('en-IN')}`, 225, 128, { bold: true });

      doc.rect(390, 105, 165, 45).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#64748b').fontSize(8).text('REPORT STATUS FILTER', 400, 115);
      doc.fillColor('#0f172a').fontSize(12).text(`${status || 'ALL STATUSES'}`, 400, 129, { bold: true });

      // Table Header
      const tableTop = 170;
      doc.rect(40, tableTop, 515, 20).fillColor('#0f172a').fill();
      doc.fillColor('#ffffff').fontSize(8);
      doc.text('Booking ID', 45, tableTop + 6, { bold: true });
      doc.text('Customer', 140, tableTop + 6, { bold: true });
      doc.text('Item', 250, tableTop + 6, { bold: true });
      doc.text('Status', 390, tableTop + 6, { bold: true });
      doc.text('Amount (INR)', 480, tableTop + 6, { bold: true, align: 'right' });

      let yPos = tableTop + 24;
      doc.fillColor('#1e293b').fontSize(8);

      bookings.slice(0, 20).forEach((b, i) => {
        let itemTitle = b.package?.title || b.hotel?.name || b.transport?.operator || 'Reservation';
        if (itemTitle.length > 25) itemTitle = itemTitle.substring(0, 22) + '...';

        if (i % 2 === 1) {
          doc.rect(40, yPos - 3, 515, 16).fillColor('#f8fafc').fill();
          doc.fillColor('#1e293b');
        }

        doc.text(`${b.bookingId}`, 45, yPos);
        doc.text(`${b.user?.name || 'Customer'}`, 140, yPos);
        doc.text(`${itemTitle}`, 250, yPos);
        doc.text(`${b.status}`, 390, yPos);
        doc.text(`₹${(b.priceBreakdown?.total || 0).toLocaleString('en-IN')}`, 480, yPos, { align: 'right' });

        yPos += 18;
      });

      if (bookings.length > 20) {
        doc.fillColor('#64748b').fontSize(8).text(`...and ${bookings.length - 20} more bookings (Download CSV for complete export)`, 40, yPos + 10, { align: 'center' });
      }

      doc.end();
      return;
    }

    // Default: JSON response
    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getRevenueTrend,
  getBookingsReport
};
