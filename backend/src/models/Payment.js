const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'EUR' },
    method: { type: String, enum: ['stripe', 'mobile_money'], default: 'stripe' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    providerSessionId: { type: String, default: '' }, // ex: id de session Stripe Checkout
    providerPaymentId: { type: String, default: '' }, // ex: payment_intent Stripe
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
