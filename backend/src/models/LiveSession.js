const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    platform: { type: String, enum: ['youtube', 'zoom'], default: 'youtube' },
    youtubeVideoId: { type: String, default: '' }, // ID de la vidéo/stream YouTube (non répertorié)
    zoomJoinUrl: { type: String, default: '' }, // lien de la réunion Zoom
    scheduledAt: { type: Date, required: true },
    isLive: { type: Boolean, default: false },
    isEnded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveSession', liveSessionSchema);
