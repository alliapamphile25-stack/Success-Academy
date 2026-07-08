const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/quizzes/lesson/:lessonId - récupère le quiz d'une leçon (sans révéler les bonnes réponses)
const getQuizByLesson = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ lesson: req.params.lessonId });
  if (!quiz) return res.status(404).json({ message: 'Aucun quiz pour cette leçon' });

  const safeQuiz = {
    _id: quiz._id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    questions: quiz.questions.map((q) => ({ _id: q._id, question: q.question, options: q.options })),
  };
  res.json(safeQuiz);
});

// @route POST /api/quizzes/:id/attempt - soumet des réponses et calcule le score
const submitAttempt = asyncHandler(async (req, res) => {
  const { answers } = req.body; // tableau d'index, dans l'ordre des questions
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz introuvable' });

  let correct = 0;
  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct += 1;
  });
  const score = Math.round((correct / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  const attempt = await QuizAttempt.create({ user: req.user._id, quiz: quiz._id, answers, score, passed });
  res.status(201).json(attempt);
});

// @route POST /api/quizzes (admin/instructor) - crée un quiz pour une leçon
const createQuiz = asyncHandler(async (req, res) => {
  const { lessonId, courseId, title, passingScore, questions } = req.body;
  if (!lessonId || !courseId || !questions || !questions.length) {
    return res.status(400).json({ message: 'Leçon, formation et questions sont requis' });
  }
  const quiz = await Quiz.create({
    lesson: lessonId,
    course: courseId,
    title,
    passingScore: passingScore || 70,
    questions,
  });
  res.status(201).json(quiz);
});

module.exports = { getQuizByLesson, submitAttempt, createQuiz };
