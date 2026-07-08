const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    progressPercent: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    certificateIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Un utilisateur ne peut être inscrit qu'une seule fois à un même cours.
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
