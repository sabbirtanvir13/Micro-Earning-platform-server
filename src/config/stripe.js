import 'dotenv/config';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
	throw new Error('Missing STRIPE_SECRET_KEY environment variable. Add it to server/.env');
}

const stripe = new Stripe(stripeKey);

export default stripe;
