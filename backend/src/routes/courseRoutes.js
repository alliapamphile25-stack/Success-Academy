const express = require('express');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  addLesson,
  deleteModule,
  deleteLesson,
} = require('../controllers/courseController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

router.get('/', getCourses);
router.get('/:id', optionalAuth, getCourseById);

router.post('/', protect, authorize('admin', 'instructor'), createCourse);
router.put('/:id', protect, authorize('admin', 'instructor'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

router.post('/:id/modules', protect, authorize('admin', 'instructor'), addModule);
router.delete('/:id/modules/:moduleId', protect, authorize('admin', 'instructor'), deleteModule);

router.post('/:id/modules/:moduleId/lessons', protect, authorize('admin', 'instructor'), addLesson);
router.delete('/:id/lessons/:lessonId', protect, authorize('admin', 'instructor'), deleteLesson);

module.exports = router;
