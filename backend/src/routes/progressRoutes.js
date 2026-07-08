const express = require('express');
const { completeLesson, getCourseProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/complete', protect, completeLesson);
router.get('/:courseId', protect, getCourseProgress);

module.exports = router;
