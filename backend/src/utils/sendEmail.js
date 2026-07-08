const nodemailer = require('nodemailer');

// Transporteur SMTP configuré via les variables d'environnement.
// En développement sans SMTP configuré, on logge simplement l'email dans la console.
async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL SIMULÉ] À: ${to} | Sujet: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@lmsplatform.com',
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
