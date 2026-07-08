const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Vérifie le JWT envoyé dans l'en-tête Authorization: Bearer <token>
// et attache l'utilisateur authentifié à req.user.
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Non autorisé, token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Utilisateur introuvable ou désactivé' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

// Comme protect, mais n'échoue pas si le token est absent/invalide :
// attache req.user si possible, sinon laisse req.user undefined.
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch (error) {
    // Token invalide : on continue simplement sans utilisateur authentifié.
  }
  next();
}

module.exports = { protect, optionalAuth };
