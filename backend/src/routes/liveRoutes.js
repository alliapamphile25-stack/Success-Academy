const express = require('express');
const {
  getLiveSessions,
  getLiveSessionById,
  createLiveSession,
  updateLiveStatus,
  getAllLiveSessionsAdmin,
} = require('../controllers/liveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

// IMPORTANT : cette route doit être déclarée AVANT /:id, sinon Express
// interpréterait "admin" comme une valeur de :id.
router.get('/admin/all', protect, authorize('admin', 'instructor'), getAllLiveSessionsAdmin);

router.get('/', protect, getLiveSessions);
router.get('/:id', protect, getLiveSessionById);
router.post('/', protect, authorize('admin', 'instructor'), createLiveSession);
router.put('/:id/status', protect, authorize('admin', 'instructor'), updateLiveStatus);

module.exports = router;
