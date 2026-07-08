const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['video', 'pdf', 'quiz', 'text'], default: 'video' },
    videoUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    content: { type: String, default: '' },
    duration: { type: Number, default: 0 }, // en secondes
    order: { type: Number, required: true, default: 0 },
    isFreePreview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', lessonSchema);
