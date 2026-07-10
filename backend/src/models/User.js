const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    // Programme d'affiliation : chaque utilisateur a un code unique à partager,
    // et on retient qui l'a parrainé (le cas échéant) pour calculer les commissions.
    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Hash le mot de passe avant sauvegarde, uniquement s'il a été modifié.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Génère un code de parrainage unique à la création du compte.
userSchema.pre('save', function generateReferralCode(next) {
  if (!this.isNew || this.referralCode) return next();
  this.referralCode = crypto.randomBytes(4).toString('hex');
  next();
});

// Compare un mot de passe en clair avec le hash stocké.
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
