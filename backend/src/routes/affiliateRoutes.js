const express = require('express');
const { getMyAffiliateStats } = require('../controllers/affiliateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getMyAffiliateStats);

module.exports = router;
