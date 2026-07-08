const Comment = require('../models/Comment');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/comments/lesson/:lessonId
const getLessonComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ lesson: req.params.lessonId })
    .populate('user', 'name avatar role')
    .sort({ createdAt: 1 });
  res.json(comments);
});

// @route POST /api/comments
const createComment = asyncHandler(async (req, res) => {
  const { lessonId, text, parentComment } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' });

  const comment = await Comment.create({
    user: req.user._id,
    lesson: lessonId,
    text: text.trim(),
    parentComment: parentComment || null,
  });
  const populated = await comment.populate('user', 'name avatar role');
  res.status(201).json(populated);
});

module.exports = { getLessonComments, createComment };
