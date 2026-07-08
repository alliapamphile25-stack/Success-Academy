const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const LiveSession = require('../models/LiveSession');

// Authentifie la connexion Socket.io via le JWT envoyé dans l'handshake.
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Non autorisé'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('Utilisateur introuvable'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
}

// Branche toute la logique temps réel du chat des sessions live sur l'instance Socket.io.
function initChatSocket(io) {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    // Le client rejoint la "room" de la session live qu'il regarde.
    socket.on('join-live', async ({ liveSessionId }) => {
      socket.join(`live-${liveSessionId}`);
      socket.to(`live-${liveSessionId}`).emit('user-joined', { name: socket.user.name });
    });

    socket.on('leave-live', ({ liveSessionId }) => {
      socket.leave(`live-${liveSessionId}`);
    });

    // Réception d'un message de chat : on le persiste puis on le diffuse à toute la room.
    socket.on('send-message', async ({ liveSessionId, text }) => {
      if (!text || !text.trim()) return;

      const session = await LiveSession.findById(liveSessionId);
      if (!session) return;

      const message = await ChatMessage.create({
        liveSession: liveSessionId,
        user: socket.user._id,
        userName: socket.user.name,
        text: text.trim().slice(0, 500),
      });

      io.to(`live-${liveSessionId}`).emit('new-message', {
        _id: message._id,
        userName: message.userName,
        text: message.text,
        role: socket.user.role,
        createdAt: message.createdAt,
      });
    });

    socket.on('disconnect', () => {
      // Rien de spécial à faire : Socket.io retire automatiquement le socket de ses rooms.
    });
  });
}

module.exports = initChatSocket;
