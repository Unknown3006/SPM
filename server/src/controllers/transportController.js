const TransportService = require('../models/TransportService');
const travelService = require('../services/providers/travelService');

/**
 * @desc    Search and list transport services (flights, trains, buses)
 * @route   GET /api/v1/transport
 * @access  Public
 */
const getTransportServices = async (req, res, next) => {
  try {
    const preferExternal = req.query.preferExternal === 'true';
    const result = await travelService.searchTransport(req.query, preferExternal);

    res.status(200).json({
      success: true,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed || false,
      fallbackNotice: result.fallbackNotice || null,
      isFromCache: result.isFromCache || false,
      count: result.data ? result.data.length : 0,
      transport: result.data || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transport service by ID
 * @route   GET /api/v1/transport/:id
 * @access  Public
 */
const getTransportById = async (req, res, next) => {
  try {
    const service = await TransportService.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Transport service not found',
        errors: ['Invalid service ID']
      });
    }

    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new transport service (Admin)
 * @route   POST /api/v1/transport
 * @access  Private (Admin)
 */
const createTransport = async (req, res, next) => {
  try {
    const service = await TransportService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Transport service created successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update transport service (Admin)
 * @route   PATCH /api/v1/transport/:id
 * @access  Private (Admin)
 */
const updateTransport = async (req, res, next) => {
  try {
    const service = await TransportService.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Transport service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transport service updated successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Deactivate transport service (Admin)
 * @route   DELETE /api/v1/transport/:id
 * @access  Private (Admin)
 */
const deleteTransport = async (req, res, next) => {
  try {
    const { hardDelete } = req.query;
    if (hardDelete === 'true') {
      await TransportService.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Transport service permanently deleted'
      });
    }

    const service = await TransportService.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Transport service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transport service deactivated successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransportServices,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport
};
