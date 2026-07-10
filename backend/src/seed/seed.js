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

// Script de seed : crée un compte admin, un formateur, deux formations de démo
// (une gratuite, une payante) avec modules/leçons/quiz, et un live planifié.
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

  const instructor = await User.create({
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

  console.log('Création de la formation "JavaScript pour débutants" (gratuite)...');
  const courseFree = await Course.create({
    title: 'JavaScript pour débutants',
    slug: 'javascript-pour-debutants',
    description:
      "Apprenez les fondamentaux de JavaScript : variables, fonctions, boucles, DOM et bien plus. Une formation idéale pour démarrer en programmation web.",
    shortDescription: 'Les bases de JavaScript, de zéro à la pratique.',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
    category: 'Développement Web',
    level: 'débutant',
    price: 0,
    instructor: instructor._id,
    isPublished: true,
  });

  const mod1 = await Module.create({ course: courseFree._id, title: 'Introduction à JavaScript', order: 1 });
  const lesson1 = await Lesson.create({
    module: mod1._id,
    course: courseFree._id,
    title: 'Bienvenue dans la formation',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
    duration: 300,
    order: 1,
    isFreePreview: true,
  });
  const lesson2 = await Lesson.create({
    module: mod1._id,
    course: courseFree._id,
    title: 'Variables et types de données',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
    duration: 600,
    order: 2,
  });
  const lesson3 = await Lesson.create({
    module: mod1._id,
    course: courseFree._id,
    title: 'Quiz : les fondamentaux',
    type: 'quiz',
    order: 3,
  });

  await Quiz.create({
    lesson: lesson3._id,
    course: courseFree._id,
    title: 'Quiz : les fondamentaux de JavaScript',
    passingScore: 70,
    questions: [
      {
        question: "Quel mot-clé permet de déclarer une variable non réassignable en JavaScript ?",
        options: ['var', 'let', 'const', 'static'],
        correctIndex: 2,
      },
      {
        question: 'Quel type de donnée représente vrai/faux ?',
        options: ['String', 'Boolean', 'Number', 'Object'],
        correctIndex: 1,
      },
    ],
  });

  console.log('Création de la formation "React & Node.js avancé" (payante)...');
  const coursePaid = await Course.create({
    title: 'React & Node.js avancé',
    slug: 'react-nodejs-avance',
    description:
      "Devenez développeur full-stack : construisez une application complète avec React, Node.js, Express et MongoDB, incluant authentification et paiements.",
    shortDescription: 'Formation complète full-stack React + Node.js.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    category: 'Développement Web',
    level: 'avancé',
    price: 149,
    currency: 'EUR',
    instructor: instructor._id,
    isPublished: true,
  });

  const mod2 = await Module.create({ course: coursePaid._id, title: 'Construire une API REST', order: 1 });
  await Lesson.create({
    module: mod2._id,
    course: coursePaid._id,
    title: 'Introduction au cours (aperçu gratuit)',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
    duration: 400,
    order: 1,
    isFreePreview: true,
  });
  await Lesson.create({
    module: mod2._id,
    course: coursePaid._id,
    title: 'Créer une API avec Express',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
    duration: 900,
    order: 2,
  });

  await LiveSession.create({
    course: coursePaid._id,
    instructor: instructor._id,
    title: 'Session Q&A en direct : Full-stack React/Node',
    description: 'Session live pour répondre à vos questions sur la formation.',
    youtubeVideoId: 'jfKfPfyJRdk',
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  });

  console.log('Création de témoignages de démonstration...');
  await Testimonial.create([
    {
      name: 'Awa K.',
      role: 'Développeuse web',
      text: "Formation très claire, le formateur répond en direct pendant les lives. J'ai décroché mon premier poste de développeur grâce à cette plateforme.",
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

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erreur pendant le seed :', err);
  process.exit(1);
});
