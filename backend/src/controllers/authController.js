const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const { asyncHandler } = require('../middleware/errorHandler');

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ message: 'Un compte existe déjà avec cet email' });
  }

  // Si un code de parrainage valide est fourni, on retient qui a parrainé ce nouvel utilisateur
  // (utilisé plus tard pour calculer les commissions d'affiliation sur ses achats).
  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) referredBy = referrer._id;
  }

  const user = await User.create({ name, email, password, referredBy });

  sendEmail({
    to: user.email,
    subject: 'Bienvenue sur Elite Tranaing',
    html: `<p>Bonjour ${user.name}, bienvenue sur notre plateforme de formation !</p>`,
  }).catch((err) => console.error('Erreur envoi email:', err.message));

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user),
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'Ce compte a été désactivé' });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    token: generateToken(user),
  });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @route PUT /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, avatar, password } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (avatar) user.avatar = avatar;
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    user.password = password;
  }

  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
});

module.exports = { register, login, getMe, updateMe };
