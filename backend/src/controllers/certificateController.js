const Certificate = require('../models/Certificate');
const generateCertificatePDF = require('../utils/generateCertificate');
const { asyncHandler } = require('../middleware/errorHandler');

// @route GET /api/certificates/me
const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ user: req.user._id }).populate('course', 'title');
  res.json(certificates);
});

// @route GET /api/certificates/:code - vérification publique d'un certificat (par son code)
const verifyCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateCode: req.params.code })
    .populate('user', 'name')
    .populate('course', 'title');
  if (!certificate) return res.status(404).json({ message: 'Certificat introuvable' });
  res.json(certificate);
});

// @route GET /api/certificates/:code/download - télécharge le PDF du certificat
const downloadCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateCode: req.params.code })
    .populate('user', 'name')
    .populate('course', 'title');
  if (!certificate) return res.status(404).json({ message: 'Certificat introuvable' });

  const pdfBuffer = await generateCertificatePDF({
    userName: certificate.user.name,
    courseTitle: certificate.course.title,
    certificateCode: certificate.certificateCode,
    issuedAt: certificate.issuedAt,
  });

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="certificat-${certificate.certificateCode}.pdf"`,
  });
  res.send(pdfBuffer);
});

module.exports = { getMyCertificates, verifyCertificate, downloadCertificate };
