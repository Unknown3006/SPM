const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

/**
 * @desc    Register a new customer account
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
        errors: ['Missing required fields']
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        errors: ['Password too short']
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        errors: ['Email already registered']
      });
    }

    // Hash password and create customer (hardcode role to customer for safety)
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      passwordHash,
      role: 'customer',
      isActive: true,
      lastLoginAt: new Date()
    });

    const token = generateToken(user._id);

    // Send welcome notification asynchronously in the background
    sendEmail({
      to: user.email,
      subject: 'Welcome to Tourism Management System!',
      text: `Hello ${user.name},\n\nWelcome to TMS! Your customer account has been created successfully.`,
      eventType: 'USER_REGISTERED',
      userId: user._id
    }).catch((err) => console.error('[Registration Email Error]', err.message));

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
        errors: ['Missing credentials']
      });
    }

    // Query user including passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: ['Authentication failed']
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.',
        errors: ['Account deactivated']
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: ['Authentication failed']
      });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Initiate forgot password (generates reset token)
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
        errors: ['Missing email']
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't leak user existence in generic message, but return success
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.'
      });
    }

    // Generate unhashed reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    // Hash token to store in database
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    // Token expires in 1 hour
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${env.CLIENT_URL}/reset-password/${rawResetToken}`;
    const emailBody = `You requested a password reset for your Tourism Management System account.\n\nPlease reset your password using the following link:\n${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.`;

    // Send reset instructions via email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - TMS',
      text: emailBody,
      eventType: 'PASSWORD_RESET_REQUESTED',
      userId: user._id
    });

    // Also send an SMS notification if phone is configured
    if (user.phone) {
      await sendSMS({
        to: user.phone,
        message: `TMS Alert: A password reset link has been sent to your email (${user.email}).`,
        eventType: 'PASSWORD_RESET_SMS',
        userId: user._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
      // In development mode, include token for testing convenience
      ...(env.NODE_ENV !== 'production' && { debugResetToken: rawResetToken, debugResetUrl: resetUrl })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid password of at least 6 characters',
        errors: ['Password invalid']
      });
    }

    // Hash the token received from the URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching unexpired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
        errors: ['Invalid or expired token']
      });
    }

    // Set new password
    user.passwordHash = await User.hashPassword(password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Changed Successfully - TMS',
        text: `Hello ${user.name},\n\nYour password has been changed successfully. You can now log in with your new password.`,
        eventType: 'PASSWORD_RESET_SUCCESS',
        userId: user._id
      });
    } catch (e) {
      // Non-blocking notification error
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now log in.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
};
