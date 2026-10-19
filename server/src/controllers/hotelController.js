const Hotel = require('../models/Hotel');
const travelService = require('../services/providers/travelService');

/**
 * @desc    Search and list hotels (via Provider abstraction with fallback)
 * @route   GET /api/v1/hotels
 * @access  Public
 */
const getHotels = async (req, res, next) => {
  try {
    const preferExternal = req.query.preferExternal === 'true';
    const result = await travelService.searchHotels(req.query, preferExternal);

    res.status(200).json({
      success: true,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed || false,
      fallbackNotice: result.fallbackNotice || null,
      isFromCache: result.isFromCache || false,
      count: result.data ? result.data.length : 0,
      hotels: result.data || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single hotel by ID
 * @route   GET /api/v1/hotels/:id
 * @access  Public
 */
const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
        errors: ['Invalid hotel ID']
      });
    }

    res.status(200).json({
      success: true,
      hotel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new hotel (Admin)
 * @route   POST /api/v1/hotels
 * @access  Private (Admin)
 */
const createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      hotel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update hotel (Admin)
 * @route   PATCH /api/v1/hotels/:id
 * @access  Private (Admin)
 */
const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hotel updated successfully',
      hotel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Deactivate hotel (Admin)
 * @route   DELETE /api/v1/hotels/:id
 * @access  Private (Admin)
 */
const deleteHotel = async (req, res, next) => {
  try {
    const { hardDelete } = req.query;
    if (hardDelete === 'true') {
      await Hotel.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Hotel permanently deleted'
      });
    }

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hotel deactivated successfully',
      hotel
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel
};
