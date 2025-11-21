// controllers/stripeWebhookController.js
import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  console.log("🔔 Webhook received - checking signature...");

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`✅ Webhook verified: ${event.type}`);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object);
        break;

      default:
        console.log(`➡️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

const handlePaymentSuccess = async (paymentIntent) => {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`);

  const booking = await Booking.findOne({
    "payment.paymentIntentId": paymentIntent.id,
  });

  if (booking) {
    booking.payment.status = "paid";
    booking.status = "pending";
    await booking.save();
    console.log(`✅ Booking ${booking._id} updated to PAID`);
  } else {
    console.log(`❌ No booking found for payment intent: ${paymentIntent.id}`);
  }
};

const handlePaymentFailure = async (paymentIntent) => {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);

  const booking = await Booking.findOne({
    "payment.paymentIntentId": paymentIntent.id,
  });

  if (booking) {
    booking.payment.status = "failed";
    await booking.save();
    console.log(`📝 Booking ${booking._id} marked as PAYMENT FAILED`);
  }
};

// Add test function for development
export const testWebhook = async (req, res) => {
  try {
    const { paymentIntentId, eventType } = req.body;

    console.log("🧪 Testing webhook with:", { paymentIntentId, eventType });

    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }

    const booking = await Booking.findOne({
      "payment.paymentIntentId": paymentIntentId,
    });

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found for this payment intent" });
    }

    if (eventType === "payment_intent.succeeded") {
      booking.payment.status = "paid";
      booking.status = "pending";
      await booking.save();

      return res.json({
        message: "Webhook test - Payment succeeded",
        booking: {
          _id: booking._id,
          status: booking.status,
          payment: booking.payment,
        },
      });
    } else if (eventType === "payment_intent.payment_failed") {
      booking.payment.status = "failed";
      await booking.save();

      return res.json({
        message: "Webhook test - Payment failed",
        booking: {
          _id: booking._id,
          status: booking.status,
          payment: booking.payment,
        },
      });
    } else {
      return res.status(400).json({
        message:
          "Invalid event type. Use 'payment_intent.succeeded' or 'payment_intent.payment_failed'",
      });
    }
  } catch (error) {
    console.error("❌ Webhook test error:", error);
    res
      .status(500)
      .json({ error: "Webhook test failed", details: error.message });
  }
};
