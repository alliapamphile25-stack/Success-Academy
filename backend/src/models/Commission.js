const mongoose = require('mongoose');

// Une commission générée pour un affilié (affiliate) quand un utilisateur qu'il a
// parrané (referredUser) achète une formation payante.
const commissionSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    amount: { type: Number, required: true },
    rate: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Commission', commissionSchema);
