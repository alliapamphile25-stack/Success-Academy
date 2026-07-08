const jwt = require('jsonwebtoken');

// Génère un JWT signé contenant l'id et le rôle de l'utilisateur.
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = generateToken;
