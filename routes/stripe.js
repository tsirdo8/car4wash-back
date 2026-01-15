// routes/stripe.js
import express from "express";
import {
  handleStripeWebhook,
  testWebhook,
} from "../controllers/stripeWebhookController.js";

const router = express.Router();

// Webhook endpoint - MUST use raw body parser
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Test endpoint for development - POST method
router.post("/test-webhook", express.json(), testWebhook);

// Add a GET endpoint for testing
router.get("/test", (req, res) => {
  res.json({
    message: "Stripe routes are working!",
    endpoints: {
      webhook: "POST /api/stripe/webhook",
      testWebhook: "POST /api/stripe/test-webhook",
      test: "GET /api/stripe/test",
    },
  });
});

router.post("/create-payment-intent", auth, async (req, res) => {
  const { amount, bookingId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents/subunits
      currency: "gel",
      metadata: { bookingId: bookingId || "unknown" },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("Create PaymentIntent error:", err.message);
    res.status(500).json({ message: "Failed to create payment intent" });
  }
});
export default router;
