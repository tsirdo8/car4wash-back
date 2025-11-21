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
router.get("  ", (req, res) => {
  res.json({
    message: "Stripe routes are working!",
    endpoints: {
      webhook: "POST /api/stripe/webhook",
      testWebhook: "POST /api/stripe/test-webhook",
      test: "GET /api/stripe/test",
    },
  });
});

export default router;
