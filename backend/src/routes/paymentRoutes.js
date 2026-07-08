const express = require('express');
const { createCheckoutSession, getMyPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// NOTE : la route webhook n'est PAS ici : elle a besoin du body brut (raw)
// et est montée directement dans server.js AVANT le middleware express.json().
router.post('/checkout', protect, createCheckoutSession);
router.get('/me', protect, getMyPayments);

module.exports = router;
