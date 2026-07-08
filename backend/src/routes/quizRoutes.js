const express = require('express');
const { getQuizByLesson, submitAttempt, createQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

router.get('/lesson/:lessonId', protect, getQuizByLesson);
router.post('/:id/attempt', protect, submitAttempt);
router.post('/', protect, authorize('admin', 'instructor'), createQuiz);

module.exports = router;
