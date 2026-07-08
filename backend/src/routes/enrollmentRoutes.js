const express = require('express');
const { getMyEnrollments, enrollFree } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getMyEnrollments);
router.post('/', protect, enrollFree);

module.exports = router;
