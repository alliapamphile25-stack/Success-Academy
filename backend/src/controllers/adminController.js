const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/admin/stats - chiffres clés pour le tableau de bord admin
const getStats = asyncHandler(async (req, res) => {
  const [usersCount, coursesCount, enrollmentsCount, revenueAgg] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  res.json({
    usersCount,
    coursesCount,
    enrollmentsCount,
    revenue: revenueAgg[0]?.total || 0,
  });
});

// @route GET /api/admin/users - liste de tous les utilisateurs
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// @route PUT /api/admin/users/:id - modifie le rôle ou le statut actif d'un utilisateur
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  await user.save();
  res.json(user);
});

// @route GET /api/admin/sales - historique des ventes
const getSales = asyncHandler(async (req, res) => {
  const sales = await Payment.find({ status: 'paid' })
    .populate('user', 'name email')
    .populate('course', 'title price')
    .sort({ createdAt: -1 });
  res.json(sales);
});

// @route GET /api/admin/courses - liste de toutes les formations (publiées ou non) pour l'admin
const getAllCoursesAdmin = asyncHandler(async (req, res) => {
  const courses = await Course.find().populate('instructor', 'name').sort({ createdAt: -1 });
  res.json(courses);
});

module.exports = { getStats, getUsers, updateUser, getSales, getAllCoursesAdmin };
