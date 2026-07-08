// Gestionnaire d'erreurs centralisé. Toute erreur passée à next(err)
// ou levée dans une route async (via asyncHandler) atterrit ici.
function notFound(req, res, next) {
  res.status(404).json({ message: `Route non trouvée : ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Erreur serveur';

  // Erreurs Mongoose courantes traduites en messages lisibles.
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Identifiant invalide';
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Cette ressource existe déjà (doublon)';
  }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

// Évite d'écrire des try/catch dans chaque contrôleur async.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { notFound, errorHandler, asyncHandler };
