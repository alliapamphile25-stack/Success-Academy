# Elite Tranaing — Plateforme de formation en ligne

Plateforme e-learning complète : inscription/connexion, catalogue de formations, lecteur de cours (vidéo/PDF/quiz), suivi de progression, certificats, paiement Stripe, sessions live avec chat temps réel, et back-office admin.

## Stack technique

| Côté | Techno |
|---|---|
| Frontend | HTML / CSS (Tailwind CDN) / JavaScript vanilla, multi-pages |
| Backend | Node.js + Express |
| Base de données | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Paiement | Stripe Checkout (webhooks) |
| Temps réel | Socket.io (chat des sessions live) |
| PDF | pdfkit (génération des certificats) |
| Email | Nodemailer |

---

## 1. Structure du projet

```
lms-platform/
├── backend/
│   ├── src/
│   │   ├── config/db.js              → connexion MongoDB
│   │   ├── models/                   → 13 schémas Mongoose (voir schéma DB plus bas)
│   │   ├── middleware/
│   │   │   ├── auth.js               → protect() / optionalAuth() : vérifie le JWT
│   │   │   ├── roles.js              → authorize('admin', ...) : contrôle d'accès par rôle
│   │   │   └── errorHandler.js       → gestion centralisée des erreurs + asyncHandler
│   │   ├── controllers/              → logique métier par domaine (auth, courses, payments...)
│   │   ├── routes/                   → déclaration des routes Express par domaine
│   │   ├── sockets/chatSocket.js     → chat temps réel des sessions live (Socket.io)
│   │   ├── utils/                    → JWT, email, génération PDF certificat
│   │   ├── seed/seed.js              → jeu de données de démonstration
│   │   └── server.js                 → point d'entrée : middlewares globaux + montage des routes
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── index.html                    → accueil (catalogue, témoignages, CTA)
    ├── register.html / login.html    → inscription / connexion
    ├── dashboard.html                → espace apprenant (formations, progression)
    ├── course.html                   → lecteur de formation (vidéo/PDF/quiz, commentaires)
    ├── live.html                     → sessions en direct (YouTube + chat Socket.io)
    ├── certificate.html              → affichage / téléchargement d'un certificat
    ├── admin/
    │   ├── index.html                → tableau de bord admin (stats, utilisateurs, ventes)
    │   └── courses.html              → gestion des formations/modules/leçons
    └── assets/
        ├── css/style.css
        └── js/                       → un fichier JS par page + api.js (wrapper fetch) + nav.js
```

---

## 2. Schéma de la base de données (MongoDB)

```
User            { name, email, password(hash), role[student|instructor|admin], avatar, isActive }
Course          { title, slug, description, price, currency, instructor→User, isPublished, studentsCount }
Module          { course→Course, title, order }
Lesson          { module→Module, course→Course, title, type[video|pdf|quiz|text], videoUrl, pdfUrl, duration, order, isFreePreview }
Enrollment      { user→User, course→Course, progressPercent, completedAt, certificateIssued }  [unique: user+course]
Progress        { user→User, course→Course, lesson→Lesson, completed, completedAt }            [unique: user+lesson]
Quiz            { lesson→Lesson, course→Course, title, passingScore, questions:[{question, options[], correctIndex}] }
QuizAttempt     { user→User, quiz→Quiz, answers[], score, passed }
Payment         { user→User, course→Course, amount, currency, method[stripe|mobile_money], status, providerSessionId }
Certificate     { user→User, course→Course, certificateCode(unique), issuedAt }
Comment         { user→User, lesson→Lesson, text, parentComment→Comment }
LiveSession     { course→Course, instructor→User, title, youtubeVideoId, scheduledAt, isLive, isEnded }
ChatMessage     { liveSession→LiveSession, user→User, userName, text }
Notification    { user→User, title, message, link, isRead }
```

**Relations clés :** un `Course` contient des `Module`, qui contiennent des `Lesson`. Une `Enrollment` relie un `User` à un `Course` et stocke le `%` global de progression, recalculé à chaque `Progress` complétée. Un `Certificate` est généré automatiquement quand `progressPercent` atteint 100%.

---

## 3. Installation et lancement en local

### Prérequis
- Node.js ≥ 18
- MongoDB (local via `mongod`, ou un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/atlas))
- Un compte Stripe (mode test) pour le paiement — optionnel pour tester le reste

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditez .env : MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY, etc.

npm run seed   # crée un admin, un formateur, un étudiant et 2 formations de démo
npm run dev    # démarre le serveur sur http://localhost:5000 (nodemon)
```

Comptes créés par `npm run seed` :
- **Admin** : `admin@lmsplatform.com` / `Admin123!`
- **Instructeur** : `instructeur@lmsplatform.com` / `Instructeur123!`
- **Étudiant** : `etudiant@lmsplatform.com` / `Etudiant123!`

### Frontend

Le frontend est 100% statique (pas de build). Le plus simple est d'utiliser l'extension **Live Server** de VS Code sur le dossier `frontend/`, ou :

```bash
cd frontend
npx serve .
```

Vérifiez que `frontend/assets/js/config.js` pointe vers `http://localhost:5000/api` (valeur par défaut).

### Paiement Stripe en local

Pour tester le webhook Stripe en local, utilisez le [Stripe CLI](https://stripe.com/docs/stripe-cli) :

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copiez le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET` de votre `.env`.

---

## 4. Déploiement en production

### Backend → Render / Railway
1. Créez un nouveau service Web, pointez sur le dossier `backend/`.
2. Build command : `npm install` — Start command : `npm start`.
3. Renseignez toutes les variables de `.env.example` dans les variables d'environnement du service.
4. Une fois déployé, configurez le webhook Stripe vers `https://votre-backend.onrender.com/api/payments/webhook`.

### Frontend → Vercel / Netlify
1. Modifiez `frontend/assets/js/config.js` avec l'URL de votre backend déployé (`API_BASE_URL`, `SOCKET_URL`).
2. Déployez le dossier `frontend/` tel quel (site statique, aucun build nécessaire).
3. Mettez à jour `CLIENT_URL` dans le `.env` du backend avec l'URL du frontend déployé (nécessaire pour CORS et les redirections Stripe).

---

## 5. Fonctionnalités implémentées

- **Auth sécurisée** : mots de passe hashés (bcrypt), JWT signé, middleware `protect`/`authorize` par rôle.
- **Cours** : modules → leçons (vidéo embed, PDF, texte, quiz), aperçu gratuit configurable par leçon.
- **Progression** : chaque leçon terminée recalcule le `%` de la formation ; à 100%, un certificat PDF est généré automatiquement.
- **Quiz** : questions à choix unique, score calculé côté serveur (les bonnes réponses ne sont jamais envoyées au client avant correction).
- **Paiement** : Stripe Checkout ; l'inscription est créée via webhook (source de vérité serveur, pas le retour navigateur). La fonction `createEnrollmentAfterPayment()` dans `paymentController.js` est volontairement générique pour brancher un second moyen de paiement (ex. CinetPay pour Mobile Money) sans dupliquer la logique d'inscription.
- **Live** : sessions programmées avec vidéo YouTube (Live non répertorié) intégrée + chat temps réel Socket.io persistant en base.
- **Admin** : statistiques, gestion des utilisateurs (rôle/activation), suivi des ventes, création de formations/modules/leçons.
- **Notifications** : générées en base (ex. paiement confirmé, certificat obtenu), consultables via `/api/notifications/me`.
- **Sécurité** : Helmet, rate limiting, CORS restreint, validation des entrées côté contrôleurs, séparation des routes publiques/protégées/admin.

## 6. Limites connues / pistes d'amélioration

- Upload de fichiers (vidéos/PDF) : actuellement on renseigne des URLs (YouTube, PDF hébergé) plutôt qu'un upload direct — à brancher sur un stockage type S3/Cloudinary si besoin.
- Mobile Money (CinetPay) : l'architecture le permet (voir `paymentController.js`) mais l'intégration concrète (API CinetPay + webhook) reste à ajouter.
- Pas de tests automatisés inclus — à ajouter avec Jest/Supertest pour le backend.
