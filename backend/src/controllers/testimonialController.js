const Testimonial = require('../models/Testimonial');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/testimonials - témoignages publiés, pour la page d'accueil
const getPublishedTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ isPublished: true }).sort({ createdAt: -1 });
  res.json(testimonials);
});

// @route GET /api/admin/testimonials - tous les témoignages (publiés ou non)
const getAllTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find().sort({ createdAt: -1 });
  res.json(testimonials);
});

// @route POST /api/admin/testimonials
const createTestimonial = asyncHandler(async (req, res) => {
  const { name, role, text, isPublished } = req.body;
  if (!name || !text) return res.status(400).json({ message: 'Nom et texte du témoignage sont requis' });

  const testimonial = await Testimonial.create({ name, role, text, isPublished: isPublished !== false });
  res.status(201).json(testimonial);
});

// @route PUT /api/admin/testimonials/:id
const updateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) return res.status(404).json({ message: 'Témoignage introuvable' });

  Object.assign(testimonial, req.body);
  await testimonial.save();
  res.json(testimonial);
});

// @route DELETE /api/admin/testimonials/:id
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) return res.status(404).json({ message: 'Témoignage introuvable' });
  res.json({ message: 'Témoignage supprimé' });
});

module.exports = {
  getPublishedTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
