const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    category: { type: String, default: 'Général' },
    level: { type: String, enum: ['débutant', 'intermédiaire', 'avancé'], default: 'débutant' },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'EUR' },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: false },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    studentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
