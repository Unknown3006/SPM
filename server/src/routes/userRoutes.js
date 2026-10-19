const express = require('express');
const { updateProfile, updatePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.patch('/me', updateProfile);
router.patch('/me/password', updatePassword);

module.exports = router;
