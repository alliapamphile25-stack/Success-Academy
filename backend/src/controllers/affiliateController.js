const User = require('../models/User');
const Commission = require('../models/Commission');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/affiliate/me - code de parrainage, statistiques et commissions de l'utilisateur connecté
const getMyAffiliateStats = asyncHandler(async (req, res) => {
  const [referredCount, commissions] = await Promise.all([
    User.countDocuments({ referredBy: req.user._id }),
    Commission.find({ affiliate: req.user._id })
      .populate('referredUser', 'name')
      .populate('course', 'title')
      .sort({ createdAt: -1 }),
  ]);

  const pendingTotal = commissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const paidTotal = commissions.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);

  res.json({
    referralCode: req.user.referralCode,
    referredCount,
    pendingTotal: Math.round(pendingTotal * 100) / 100,
    paidTotal: Math.round(paidTotal * 100) / 100,
    commissions,
  });
});

module.exports = { getMyAffiliateStats };
