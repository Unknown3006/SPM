const PDFDocument = require('pdfkit');

/**
 * Generates a clean, professional PDF invoice as a buffer.
 *
 * @param {Object} booking Mongoose booking document (populated)
 * @param {Object} payment Mongoose payment document
 * @param {Object} user User document
 * @returns {Promise<Buffer>}
 */
const generateInvoicePDF = (booking, payment, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Brand
      doc
        .fillColor('#0284c7') // Sky 600
        .fontSize(22)
        .text('Tourism Management System (TMS)', 50, 50, { bold: true });

      doc
        .fillColor('#64748b')
        .fontSize(10)
        .text('Official Booking Tax Invoice & Confirmation', 50, 78);

      // Status Stamp (Green "PAID")
      doc
        .rect(460, 50, 85, 26)
        .fillAndStroke('#ecfdf5', '#10b981');
      doc
        .fillColor('#059669')
        .fontSize(12)
        .text('PAID', 485, 57, { bold: true });

      // Horizontal Divider
      doc
        .moveTo(50, 105)
        .lineTo(545, 105)
        .strokeColor('#cbd5e1')
        .stroke();

      // Invoice & Customer Info
      doc.fillColor('#334155').fontSize(10);

      const invoiceDate = payment.createdAt
        ? new Date(payment.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('en-IN');

      // Left Column - Billed To
      doc.text('BILLED TO:', 50, 120, { bold: true });
      doc.text(`${user.name || 'Valued Customer'}`, 50, 135);
      doc.text(`Email: ${user.email}`, 50, 150);
      if (user.phone) doc.text(`Phone: ${user.phone}`, 50, 165);

      // Right Column - Invoice Meta
      doc.text('INVOICE DETAILS:', 350, 120, { bold: true });
      doc.text(`Invoice No: ${payment.invoiceNumber || 'INV-PENDING'}`, 350, 135);
      doc.text(`Invoice Date: ${invoiceDate}`, 350, 150);
      doc.text(`Booking ID: ${booking.bookingId}`, 350, 165);

      // Horizontal Divider
      doc
        .moveTo(50, 190)
        .lineTo(545, 190)
        .strokeColor('#e2e8f0')
        .stroke();

      // Booking Details Section
      doc.fillColor('#0f172a').fontSize(12).text('Trip & Reservation Details', 50, 205, { bold: true });

      let itemName = 'Travel Item';
      if (booking.itemType === 'package' && booking.package) {
        itemName = booking.package.title || 'Holiday Tour Package';
      } else if (booking.itemType === 'hotel' && booking.hotel) {
        itemName = `${booking.hotel.name} (${booking.roomType || 'Standard Room'})`;
      } else if (booking.itemType === 'transport' && booking.transport) {
        itemName = `${booking.transport.operator} [${booking.transport.type?.toUpperCase()}] - ${booking.transport.from} to ${booking.transport.to}`;
      }

      doc.fillColor('#334155').fontSize(10);
      doc.text(`Item: ${itemName}`, 50, 225);

      if (booking.travelDate) {
        const formattedDate = new Date(booking.travelDate).toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        doc.text(`Travel / Departure Date: ${formattedDate}`, 50, 240);
      } else if (booking.checkInDate && booking.checkOutDate) {
        const inDate = new Date(booking.checkInDate).toLocaleDateString('en-IN');
        const outDate = new Date(booking.checkOutDate).toLocaleDateString('en-IN');
        doc.text(`Stay Dates: ${inDate} to ${outDate}`, 50, 240);
      }

      doc.text(`Number of Travellers / Guests: ${booking.numberOfTravellers}`, 50, 255);

      // Travellers sublist
      if (booking.travellers && booking.travellers.length > 0) {
        const travellerNames = booking.travellers.map((t) => `${t.name} (${t.age}y, ${t.gender})`).join(', ');
        doc.text(`Travellers: ${travellerNames}`, 50, 270);
      }

      // Price Breakdown Table Header
      const tableTop = 300;
      doc
        .rect(50, tableTop, 495, 22)
        .fillColor('#f8fafc')
        .fill();

      doc.fillColor('#475569').fontSize(10);
      doc.text('Description', 60, tableTop + 6, { bold: true });
      doc.text('Qty / Units', 340, tableTop + 6, { bold: true });
      doc.text('Amount (INR)', 450, tableTop + 6, { bold: true, align: 'right' });

      // Table Row - Base Price
      let currentY = tableTop + 30;
      doc.fillColor('#1e293b');
      doc.text(`Base Fare (₹${booking.priceBreakdown.unitPrice} per traveller)`, 60, currentY);
      doc.text(`${booking.numberOfTravellers}`, 340, currentY);
      doc.text(`₹${booking.priceBreakdown.basePrice.toLocaleString('en-IN')}`, 450, currentY, { align: 'right' });

      // Table Row - Discount if any
      if (booking.priceBreakdown.discount > 0) {
        currentY += 20;
        doc.fillColor('#059669');
        doc.text(
          `Promo Discount (${booking.appliedOfferCode || 'OFFER'})`,
          60,
          currentY
        );
        doc.text('1', 340, currentY);
        doc.text(`- ₹${booking.priceBreakdown.discount.toLocaleString('en-IN')}`, 450, currentY, { align: 'right' });
      }

      // Table Row - Taxes
      currentY += 20;
      doc.fillColor('#1e293b');
      doc.text('GST / Statutory Taxes (5%)', 60, currentY);
      doc.text('5%', 340, currentY);
      doc.text(`₹${booking.priceBreakdown.taxes.toLocaleString('en-IN')}`, 450, currentY, { align: 'right' });

      // Table Divider
      currentY += 20;
      doc
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .strokeColor('#cbd5e1')
        .stroke();

      // Table Total Row
      currentY += 10;
      doc.fillColor('#0f172a').fontSize(12);
      doc.text('Total Paid:', 300, currentY, { bold: true });
      doc.text(`₹${booking.priceBreakdown.total.toLocaleString('en-IN')}`, 450, currentY, { bold: true, align: 'right' });

      // Payment Details Box
      const boxTop = currentY + 35;
      doc
        .roundedRect(50, boxTop, 495, 65, 4)
        .strokeColor('#e2e8f0')
        .stroke();

      doc.fillColor('#334155').fontSize(9);
      doc.text('PAYMENT CONFIRMATION RECEIPT', 65, boxTop + 12, { bold: true });
      doc.text(`Payment Method: ${payment.method} | Gateway: ${payment.gateway || 'MockGateway'}`, 65, boxTop + 27);
      doc.text(`Gateway Reference ID: ${payment.gatewayPaymentId || 'N/A'}`, 65, boxTop + 40);
      doc.text(`Order ID: ${payment.gatewayOrderId || 'N/A'} | Status: ${payment.status}`, 65, boxTop + 52);

      // Footer
      doc
        .moveTo(50, 720)
        .lineTo(545, 720)
        .strokeColor('#e2e8f0')
        .stroke();

      doc
        .fillColor('#94a3b8')
        .fontSize(8)
        .text('Thank you for travelling with Tourism Management System (TMS).', 50, 730, { align: 'center' });
      doc.text('For queries or support, email support@tms.test or visit our Help Center at /help.', 50, 742, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoicePDF
};
