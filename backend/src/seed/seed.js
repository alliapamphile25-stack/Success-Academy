require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const LiveSession = require('../models/LiveSession');
const Testimonial = require('../models/Testimonial');

// Script de seed : crée un compte admin, un formateur, un étudiant et des
// témoignages de démonstration. Ne crée plus de formations de démo : celles-ci
// sont à créer via le back-office admin (admin/courses.html).
// Lancer avec : npm run seed
async function seed() {
  await connectDB();

  console.log('Nettoyage des données existantes...');
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Lesson.deleteMany({}),
    Quiz.deleteMany({}),
    LiveSession.deleteMany({}),
    Testimonial.deleteMany({}),
  ]);

  console.log('Création du compte admin...');
  const admin = await User.create({
    name: 'Administrateur',
    email: process.env.ADMIN_EMAIL || 'admin@lmsplatform.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    role: 'admin',
  });

  await User.create({
    name: 'Sophie Martin',
    email: 'instructeur@lmsplatform.com',
    password: 'Instructeur123!',
    role: 'instructor',
  });

  await User.create({
    name: 'Jean Dupont',
    email: 'etudiant@lmsplatform.com',
    password: 'Etudiant123!',
    role: 'student',
  });

  console.log('Création de témoignages de démonstration...');
  await Testimonial.create([
    {
      name: 'Awa K.',
      role: 'Responsable RH',
      text: "Formation très claire, le formateur répond en direct pendant les lives. J'ai pu appliquer ce que j'ai appris dès la semaine suivante.",
    },
    {
      name: 'Marc T.',
      role: 'Étudiant',
      text: "Le suivi de progression et les quiz m'ont vraiment aidée à rester motivée jusqu'au bout de la formation.",
    },
    {
      name: 'Fatou D.',
      role: 'Apprenante',
      text: 'Interface simple, contenu de qualité, et le certificat final est un vrai plus sur mon CV.',
    },
  ]);

  console.log('\nSeed terminé avec succès !');
  console.log('----------------------------------------');
  console.log(`Admin       : ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
  console.log('Instructeur : instructeur@lmsplatform.com / Instructeur123!');
  console.log('Étudiant    : etudiant@lmsplatform.com / Etudiant123!');
  console.log('----------------------------------------');
  console.log('Aucune formation de démo créée — ajoutez vos formations via le back-office admin.');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erreur pendant le seed :', err);
  process.exit(1);
});
