const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const { asyncHandler } = require('../middleware/errorHandler');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// @route GET /api/courses (public - liste des cours publiés)
const getCourses = asyncHandler(async (req, res) => {
  const { category, level, search } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const courses = await Course.find(filter).populate('instructor', 'name avatar').sort({ createdAt: -1 });
  res.json(courses);
});

// @route GET /api/courses/:id (détail public d'un cours + structure modules/leçons)
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name avatar');
  if (!course) return res.status(404).json({ message: 'Formation introuvable' });

  const modules = await Module.find({ course: course._id }).sort({ order: 1 });
  const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });

  const modulesWithLessons = modules.map((m) => ({
    ...m.toObject(),
    lessons: lessons.filter((l) => String(l.module) === String(m._id)),
  }));

  let isEnrolled = false;
  if (req.user) {
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
    isEnrolled = !!enrollment;
  }

  res.json({ ...course.toObject(), modules: modulesWithLessons, isEnrolled });
});

// @route POST /api/courses (admin/instructor)
const createCourse = asyncHandler(async (req, res) => {
  const { title, description, shortDescription, thumbnail, category, level, price, currency } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'Titre et description requis' });
  }

  let slug = slugify(title);
  const slugExists = await Course.findOne({ slug });
  if (slugExists) slug = `${slug}-${Date.now()}`;

  const course = await Course.create({
    title,
    slug,
    description,
    shortDescription,
    thumbnail,
    category,
    level,
    price: price || 0,
    currency: currency || 'EUR',
    instructor: req.user._id,
  });

  res.status(201).json(course);
});

// @route PUT /api/courses/:id (admin/instructor)
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Formation introuvable' });

  Object.assign(course, req.body);
  await course.save();
  res.json(course);
});

// @route DELETE /api/courses/:id (admin)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Formation introuvable' });

  await Lesson.deleteMany({ course: course._id });
  await Module.deleteMany({ course: course._id });
  await course.deleteOne();
  res.json({ message: 'Formation supprimée' });
});

// @route POST /api/courses/:id/modules (admin/instructor)
const addModule = asyncHandler(async (req, res) => {
  const { title, order } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Formation introuvable' });

  const module = await Module.create({ course: course._id, title, order: order || 0 });
  res.status(201).json(module);
});

// @route POST /api/courses/:id/modules/:moduleId/lessons (admin/instructor)
const addLesson = asyncHandler(async (req, res) => {
  const { title, type, videoUrl, pdfUrl, content, duration, order, isFreePreview } = req.body;
  const module = await Module.findById(req.params.moduleId);
  if (!module) return res.status(404).json({ message: 'Module introuvable' });

  const lesson = await Lesson.create({
    module: module._id,
    course: req.params.id,
    title,
    type,
    videoUrl,
    pdfUrl,
    content,
    duration,
    order: order || 0,
    isFreePreview: !!isFreePreview,
  });
  res.status(201).json(lesson);
});

// @route DELETE /api/courses/:id/modules/:moduleId (admin/instructor)
const deleteModule = asyncHandler(async (req, res) => {
  await Lesson.deleteMany({ module: req.params.moduleId });
  await Module.findByIdAndDelete(req.params.moduleId);
  res.json({ message: 'Module supprimé' });
});

// @route DELETE /api/courses/:id/lessons/:lessonId (admin/instructor)
const deleteLesson = asyncHandler(async (req, res) => {
  await Lesson.findByIdAndDelete(req.params.lessonId);
  res.json({ message: 'Leçon supprimée' });
});

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  addLesson,
  deleteModule,
  deleteLesson,
};
