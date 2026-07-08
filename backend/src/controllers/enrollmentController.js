const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/enrollments/me - formations de l'utilisateur connecté (dashboard)
const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id })
    .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(enrollments);
});

// @route POST /api/enrollments (inscription directe - utilisé pour les cours gratuits)
const enrollFree = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: 'Formation introuvable' });
  if (course.price > 0) {
    return res.status(400).json({ message: 'Cette formation est payante, utilisez le paiement' });
  }

  const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (existing) return res.status(400).json({ message: 'Déjà inscrit à cette formation' });

  const enrollment = await Enrollment.create({ user: req.user._id, course: courseId });
  course.studentsCount += 1;
  await course.save();

  res.status(201).json(enrollment);
});

module.exports = { getMyEnrollments, enrollFree };
