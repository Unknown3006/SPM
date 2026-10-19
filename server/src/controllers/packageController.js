const TourPackage = require('../models/TourPackage');

/**
 * @desc    Get all tour packages with filters, search, sorting & pagination
 * @route   GET /api/v1/packages
 * @access  Public
 */
const getPackages = async (req, res, next) => {
  try {
    const {
      search,
      destination,
      category,
      minPrice,
      maxPrice,
      durationDays,
      sortBy,
      page = 1,
      limit = 9
    } = req.query;

    const query = { isActive: true };

    // Search query
    if (search) {
      query.$or = [
        { destination: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }

    if (category) {
      query.category = category.toLowerCase();
    }

    // Budget range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Duration filter
    if (durationDays) {
      query.durationDays = Number(durationDays);
    }

    // Sorting
    let sort = { createdAt: -1 };
    if (sortBy === 'price_asc') sort = { price: 1 };
    else if (sortBy === 'price_desc') sort = { price: -1 };
    else if (sortBy === 'rating') sort = { ratingAverage: -1 };
    else if (sortBy === 'duration') sort = { durationDays: 1 };

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await TourPackage.countDocuments(query);
    const packages = await TourPackage.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: packages.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      packages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single tour package by ID
 * @route   GET /api/v1/packages/:id
 * @access  Public
 */
const getPackageById = async (req, res, next) => {
  try {
    const tour = await TourPackage.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found',
        errors: ['Invalid package ID']
      });
    }

    res.status(200).json({
      success: true,
      package: tour
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new tour package (Admin)
 * @route   POST /api/v1/packages
 * @access  Private (Admin)
 */
const createPackage = async (req, res, next) => {
  try {
    const newPackage = await TourPackage.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Tour package created successfully',
      package: newPackage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update tour package (Admin)
 * @route   PATCH /api/v1/packages/:id
 * @access  Private (Admin)
 */
const updatePackage = async (req, res, next) => {
  try {
    const updated = await TourPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found',
        errors: ['Package not found']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tour package updated successfully',
      package: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Deactivate tour package (Admin)
 * @route   DELETE /api/v1/packages/:id
 * @access  Private (Admin)
 */
const deletePackage = async (req, res, next) => {
  try {
    const { hardDelete } = req.query;

    if (hardDelete === 'true') {
      const deleted = await TourPackage.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Package permanently removed'
      });
    }

    // Default soft-deactivate
    const deactivated = await TourPackage.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!deactivated) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Package deactivated successfully',
      package: deactivated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
};
