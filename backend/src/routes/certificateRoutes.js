const express = require('express');
const { getMyCertificates, verifyCertificate, downloadCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getMyCertificates);
router.get('/:code', verifyCertificate);
router.get('/:code/download', downloadCertificate);

module.exports = router;
