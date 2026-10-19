const express = require('express');
const { getAllUsers, toggleUserStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here require valid JWT and 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);

module.exports = router;
