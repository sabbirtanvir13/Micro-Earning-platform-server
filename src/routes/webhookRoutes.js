import express from 'express';
import stripe from '../config/stripe.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

const router = express.Router();

// Stripe webhook endpoint
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        const payment = await Payment.findOne({
          stripePaymentIntentId: session.id,
        });

        if (payment && payment.status === 'pending') {
          // Add coins to buyer
          const buyer = await User.findById(payment.buyerId);
          if (buyer) {
            buyer.coins += payment.coins;
            await buyer.save();
          }

          // Update payment status
          payment.status = 'succeeded';
          await payment.save();
        }
      } catch (error) {
        console.error('Error processing webhook:', error);
      }
    }

    res.json({ received: true });
  }
);

export default router;
