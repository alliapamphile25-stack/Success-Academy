const express = require('express');
const {
  getLiveSessions,
  getLiveSessionById,
  createLiveSession,
  updateLiveStatus,
} = require('../controllers/liveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

router.get('/', protect, getLiveSessions);
router.get('/:id', protect, getLiveSessionById);
router.post('/', protect, authorize('admin', 'instructor'), createLiveSession);
router.put('/:id/status', protect, authorize('admin', 'instructor'), updateLiveStatus);

module.exports = router;
