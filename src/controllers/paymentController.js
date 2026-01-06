import Payment from '../models/Payment.js';
import User from '../models/User.js';
import stripe from '../config/stripe.js';

// Create payment intent (buyer)
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, coins } = req.body;

    if (!amount || !coins) {
      return res.status(400).json({ message: 'Amount and coins are required' });
    }

    // Create payment record first
    const payment = new Payment({
      buyerId: req.user._id,
      amount,
      coins,
      status: 'pending',
    });
    await payment.save();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${coins} Coins`,
              description: 'Micro Task Platform Coins',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/buyer/payments?success=true&paymentId=${payment._id}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/buyer/payments?canceled=true`,
      metadata: {
        paymentId: payment._id.toString(),
        buyerId: req.user._id.toString(),
        coins: coins.toString(),
      },
    });

    // Update payment with session ID
    payment.stripePaymentIntentId = session.id;
    await payment.save();

    res.json({
      sessionId: session.id,
      url: session.url,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Confirm payment (webhook or manual)
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded' && payment.status === 'pending') {
      // Add coins to buyer
      const buyer = await User.findById(payment.buyerId);
      buyer.coins += payment.coins;
      await buyer.save();

      // Update payment status
      payment.status = 'succeeded';
      await payment.save();

      res.json({ message: 'Payment confirmed', payment });
    } else {
      res.json({ message: 'Payment already processed or failed', payment });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get buyer's payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
