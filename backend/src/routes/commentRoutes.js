const express = require('express');
const { getLessonComments, createComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/lesson/:lessonId', protect, getLessonComments);
router.post('/', protect, createComment);

module.exports = router;
