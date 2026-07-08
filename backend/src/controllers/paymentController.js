const Stripe = require('stripe');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @route POST /api/payments/checkout - crée une session Stripe Checkout pour une formation payante.
// Architecture volontairement découplée : createEnrollmentAfterPayment() est appelée depuis
// le webhook Stripe, mais pourrait tout aussi bien être appelée depuis un webhook CinetPay
// (Mobile Money) en ajoutant un nouveau provider sans toucher au reste du flux.
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: 'Formation introuvable' });
  if (course.price <= 0) return res.status(400).json({ message: 'Cette formation est gratuite' });

  const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (existing) return res.status(400).json({ message: 'Déjà inscrit à cette formation' });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: course.currency.toLowerCase(),
          product_data: { name: course.title, description: course.shortDescription || undefined },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { userId: String(req.user._id), courseId: String(course._id) },
    success_url: `${process.env.CLIENT_URL}/dashboard.html?payment=success`,
    cancel_url: `${process.env.CLIENT_URL}/course.html?id=${course._id}&payment=cancelled`,
  });

  await Payment.create({
    user: req.user._id,
    course: course._id,
    amount: course.price,
    currency: course.currency,
    method: 'stripe',
    status: 'pending',
    providerSessionId: session.id,
  });

  res.json({ url: session.url });
});

// Logique partagée : crée l'inscription une fois le paiement confirmé, quel que soit le moyen de paiement.
async function createEnrollmentAfterPayment({ userId, courseId, payment }) {
  const existing = await Enrollment.findOne({ user: userId, course: courseId });
  if (existing) return existing;

  const enrollment = await Enrollment.create({ user: userId, course: courseId });
  await Course.findByIdAndUpdate(courseId, { $inc: { studentsCount: 1 } });

  if (payment) {
    payment.status = 'paid';
    await payment.save();
  }

  await Notification.create({
    user: userId,
    title: 'Paiement confirmé',
    message: 'Votre inscription à la formation est confirmée. Bon apprentissage !',
    link: `/course.html?id=${courseId}`,
  });

  return enrollment;
}

// @route POST /api/payments/webhook - endpoint appelé par Stripe (raw body requis)
const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature webhook Stripe invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, courseId } = session.metadata;

    const payment = await Payment.findOne({ providerSessionId: session.id });
    if (payment && payment.status !== 'paid') {
      payment.providerPaymentId = session.payment_intent;
      await createEnrollmentAfterPayment({ userId, courseId, payment });
    }
  }

  res.json({ received: true });
});

// @route GET /api/payments/me - historique des paiements de l'utilisateur
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).populate('course', 'title').sort({ createdAt: -1 });
  res.json(payments);
});

module.exports = { createCheckoutSession, stripeWebhook, getMyPayments, createEnrollmentAfterPayment };
