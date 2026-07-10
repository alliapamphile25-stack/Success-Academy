const express = require('express');
const { getPublishedTestimonials } = require('../controllers/testimonialController');

const router = express.Router();

router.get('/', getPublishedTestimonials);

module.exports = router;
