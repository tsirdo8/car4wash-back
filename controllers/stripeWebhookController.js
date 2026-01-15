// controllers/stripeWebhookController.js
import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  console.log("Webhook received:", new Date().toISOString());

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`Verified event: ${event.type} (ID: ${event.id})`);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Acknowledge immediately – Stripe requires fast 200 OK
  res.status(200).json({ received: true });

  // Process event asynchronously (non-blocking)
  processEventAsync(event).catch((err) => {
    console.error("Background webhook processing failed:", err);
  });
};

// Background processing (runs after response is sent)
async function processEventAsync(event) {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object);
        break;

      default:
        console.log(`Ignored event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook event processing error:", err);
  }
}

const handlePaymentSuccess = async (paymentIntent) => {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  const booking = await Booking.findOne({
    "payment.paymentIntentId": paymentIntent.id,
  });

  if (!booking) {
    console.log(`No booking found for ${paymentIntent.id}`);
    return;
  }

  // Idempotency: skip if already processed
  if (booking.payment.status === "paid") {
    console.log(`Already processed: ${paymentIntent.id}`);
    return;
  }

  booking.payment.status = "paid";
  booking.status = "pending"; // or "confirmed" if auto-accept
  await booking.save();

  console.log(`Booking ${booking._id} updated to PAID`);
};

const handlePaymentFailure = async (paymentIntent) => {
  console.log(`Payment failed: ${paymentIntent.id}`);

  const booking = await Booking.findOne({
    "payment.paymentIntentId": paymentIntent.id,
  });

  if (booking && booking.payment.status !== "failed") {
    booking.payment.status = "failed";
    await booking.save();
    console.log(`Booking ${booking._id} marked FAILED`);
  }
};

// Test endpoint (for local dev only – disable in production if needed)
export const testWebhook = async (req, res) => {
  try {
    const { paymentIntentId, eventType = "payment_intent.succeeded" } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId required" });
    }

    const booking = await Booking.findOne({
      "payment.paymentIntentId": paymentIntentId,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (eventType === "payment_intent.succeeded") {
      await handlePaymentSuccess({ id: paymentIntentId });
      return res.json({ message: "Test: Payment succeeded", booking });
    } else if (eventType === "payment_intent.payment_failed") {
      await handlePaymentFailure({ id: paymentIntentId });
      return res.json({ message: "Test: Payment failed", booking });
    } else {
      return res.status(400).json({ message: "Invalid event type" });
    }
  } catch (err) {
    console.error("Test webhook error:", err);
    res.status(500).json({ error: err.message });
  }
};