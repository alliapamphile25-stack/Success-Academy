const LiveSession = require('../models/LiveSession');
const ChatMessage = require('../models/ChatMessage');
const Enrollment = require('../models/Enrollment');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/live - liste des sessions live (à venir + en cours) accessibles à l'utilisateur
const getLiveSessions = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id }).select('course');
  const courseIds = enrollments.map((e) => e.course);

  const sessions = await LiveSession.find({ course: { $in: courseIds }, isEnded: false })
    .populate('course', 'title')
    .populate('instructor', 'name')
    .sort({ scheduledAt: 1 });
  res.json(sessions);
});

// @route GET /api/live/:id
const getLiveSessionById = asyncHandler(async (req, res) => {
  const session = await LiveSession.findById(req.params.id).populate('course', 'title').populate('instructor', 'name');
  if (!session) return res.status(404).json({ message: 'Session live introuvable' });

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: session.course._id });
  if (!enrollment && req.user.role === 'student') {
    return res.status(403).json({ message: "Vous n'êtes pas inscrit à la formation liée à ce live" });
  }

  const messages = await ChatMessage.find({ liveSession: session._id }).sort({ createdAt: 1 }).limit(200);
  res.json({ session, messages });
});

// @route POST /api/live (admin/instructor) - planifie un live (YouTube ou Zoom)
const createLiveSession = asyncHandler(async (req, res) => {
  const { course, title, description, platform, youtubeVideoId, zoomJoinUrl, scheduledAt } = req.body;

  if (!course || !title || !scheduledAt) {
    return res.status(400).json({ message: 'Formation, titre et date sont requis' });
  }
  if (platform === 'zoom' && !zoomJoinUrl) {
    return res.status(400).json({ message: 'Le lien Zoom est requis pour une session Zoom' });
  }
  if (platform !== 'zoom' && !youtubeVideoId) {
    return res.status(400).json({ message: "L'ID de la vidéo YouTube est requis pour une session YouTube" });
  }

  const session = await LiveSession.create({
    course,
    instructor: req.user._id,
    title,
    description,
    platform: platform === 'zoom' ? 'zoom' : 'youtube',
    youtubeVideoId: platform === 'zoom' ? '' : youtubeVideoId,
    zoomJoinUrl: platform === 'zoom' ? zoomJoinUrl : '',
    scheduledAt,
  });
  res.status(201).json(session);
});

// @route GET /api/live/admin/all (admin/instructor) - toutes les sessions live, pour la gestion
const getAllLiveSessionsAdmin = asyncHandler(async (req, res) => {
  const sessions = await LiveSession.find()
    .populate('course', 'title')
    .populate('instructor', 'name')
    .sort({ scheduledAt: -1 });
  res.json(sessions);
});

// @route PUT /api/live/:id/status (admin/instructor) - démarre/termine un live
const updateLiveStatus = asyncHandler(async (req, res) => {
  const { isLive, isEnded } = req.body;
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session live introuvable' });

  if (typeof isLive === 'boolean') session.isLive = isLive;
  if (typeof isEnded === 'boolean') session.isEnded = isEnded;
  await session.save();
  res.json(session);
});

module.exports = {
  getLiveSessions,
  getLiveSessionById,
  createLiveSession,
  updateLiveStatus,
  getAllLiveSessionsAdmin,
};
