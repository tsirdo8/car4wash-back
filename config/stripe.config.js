// services/stripeService.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (
  amount,
  currency = "usd",
  metadata = {}
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
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
    console.error("Stripe payment intent error:", error);
    throw new Error("Payment processing failed");
  }
};

export const confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === "succeeded";
  } catch (error) {
    console.error("Stripe confirm payment error:", error);
    return false;
  }
};
