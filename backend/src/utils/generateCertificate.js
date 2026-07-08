const PDFDocument = require('pdfkit');

// Génère un PDF de certificat en mémoire et le retourne sous forme de Buffer.
// Appelé quand un apprenant termine 100% d'un cours.
function generateCertificatePDF({ userName, courseTitle, certificateCode, issuedAt }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = doc.page.width;
    const height = doc.page.height;

    doc.rect(20, 20, width - 40, height - 40).lineWidth(3).stroke('#2563eb');
    doc.rect(30, 30, width - 60, height - 60).lineWidth(1).stroke('#16a34a');

    doc
      .fontSize(30)
      .fillColor('#1e293b')
      .font('Helvetica-Bold')
      .text('CERTIFICAT DE RÉUSSITE', 0, 100, { align: 'center' });

    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#475569')
      .text('Ce certificat est décerné à', 0, 160, { align: 'center' });

    doc
      .fontSize(26)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(userName, 0, 190, { align: 'center' });

    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#475569')
      .text('pour avoir complété avec succès la formation', 0, 240, { align: 'center' });

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#16a34a')
      .text(courseTitle, 0, 265, { align: 'center' });

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Délivré le ${new Date(issuedAt).toLocaleDateString('fr-FR')}`, 0, 320, { align: 'center' })
      .text(`Code de vérification : ${certificateCode}`, 0, 340, { align: 'center' });

    doc.end();
  });
}

module.exports = generateCertificatePDF;
