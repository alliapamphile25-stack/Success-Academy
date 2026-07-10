const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Commission = require('../models/Commission');
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

// @route GET /api/admin/commissions - toutes les commissions d'affiliation
const getAllCommissions = asyncHandler(async (req, res) => {
  const commissions = await Commission.find()
    .populate('affiliate', 'name email')
    .populate('referredUser', 'name')
    .populate('course', 'title')
    .sort({ createdAt: -1 });
  res.json(commissions);
});

// @route PUT /api/admin/commissions/:id/pay - marque une commission comme payée
const markCommissionPaid = asyncHandler(async (req, res) => {
  const commission = await Commission.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true });
  if (!commission) return res.status(404).json({ message: 'Commission introuvable' });
  res.json(commission);
});

module.exports = { getStats, getUsers, updateUser, getSales, getAllCoursesAdmin, getAllCommissions, markCommissionPaid };
