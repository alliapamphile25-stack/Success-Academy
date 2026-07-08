const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

// @route POST /api/progress/complete - marque une leçon comme terminée
// et recalcule le pourcentage de progression du cours + délivre le certificat si 100%.
const completeLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.body;
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return res.status(404).json({ message: 'Leçon introuvable' });

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: lesson.course });
  if (!enrollment) return res.status(403).json({ message: "Vous n'êtes pas inscrit à cette formation" });

  await Progress.findOneAndUpdate(
    { user: req.user._id, lesson: lessonId },
    { user: req.user._id, course: lesson.course, lesson: lessonId, completed: true, completedAt: new Date() },
    { upsert: true, new: true }
  );

  const totalLessons = await Lesson.countDocuments({ course: lesson.course });
  const completedLessons = await Progress.countDocuments({
    user: req.user._id,
    course: lesson.course,
    completed: true,
  });
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  enrollment.progressPercent = progressPercent;

  let certificate = null;
  if (progressPercent >= 100 && !enrollment.certificateIssued) {
    enrollment.completedAt = new Date();
    enrollment.certificateIssued = true;
    certificate = await Certificate.create({
      user: req.user._id,
      course: lesson.course,
      certificateCode: uuidv4().split('-')[0].toUpperCase(),
    });
    await Notification.create({
      user: req.user._id,
      title: 'Félicitations 🎉',
      message: 'Vous avez terminé la formation et obtenu votre certificat !',
      link: `/certificate.html?code=${certificate.certificateCode}`,
    });
  }

  await enrollment.save();
  res.json({ progressPercent, certificateIssued: enrollment.certificateIssued, certificate });
});

// @route GET /api/progress/:courseId - liste des leçons complétées pour un cours
const getCourseProgress = asyncHandler(async (req, res) => {
  const progress = await Progress.find({ user: req.user._id, course: req.params.courseId, completed: true });
  res.json(progress.map((p) => String(p.lesson)));
});

module.exports = { completeLesson, getCourseProgress };
