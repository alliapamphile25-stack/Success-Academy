// Restreint l'accès à une route à une liste de rôles autorisés.
// Utilisation : router.get('/admin', protect, authorize('admin'), handler)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé : permissions insuffisantes" });
    }
    next();
  };
}

module.exports = { authorize };
