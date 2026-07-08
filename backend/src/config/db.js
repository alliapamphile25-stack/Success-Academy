const mongoose = require('mongoose');

// Se connecte à MongoDB avec l'URI défini dans .env.
// En cas d'échec, on arrête le process car l'API ne peut pas fonctionner sans DB.
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erreur de connexion MongoDB : ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
