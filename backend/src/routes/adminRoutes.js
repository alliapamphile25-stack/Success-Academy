const express = require('express');
const {
  getStats,
  getUsers,
  updateUser,
  getSales,
  getAllCoursesAdmin,
  getAllCommissions,
  markCommissionPaid,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/sales', getSales);
router.get('/courses', getAllCoursesAdmin);
router.get('/commissions', getAllCommissions);
router.put('/commissions/:id/pay', markCommissionPaid);

module.exports = router;
