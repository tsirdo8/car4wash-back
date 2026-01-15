// services/stripeService.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (
  amount,           // number in main units (e.g. 50 for 50 ₾)
  currency = "gel",
  metadata = {}
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to smallest unit (cents/subunits)
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Stripe PaymentIntent error:", error.message);
    throw new Error("Failed to create payment intent");
  }
};