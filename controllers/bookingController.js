// controllers/bookingController.js
import Booking from "../models/Booking.js";
import Carwash from "../models/Carwash.js";
import {
  createPaymentIntent,
  confirmPayment,
} from "../config/stripe.config.js";

/**
 * Customer creates booking with payment
 */
export const createBooking = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res
        .status(403)
        .json({ message: "Only customers can create bookings" });
    }

    const { carwashId, serviceId, scheduledTime } = req.body;
    if (!carwashId || !serviceId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const carwash = await Carwash.findById(carwashId);
    if (!carwash) return res.status(404).json({ message: "Carwash not found" });

    const service =
      carwash.services.id(serviceId) ||
      carwash.services.find((s) => String(s._id) === String(serviceId));

    if (!service) return res.status(400).json({ message: "Service not found" });

    // Create booking first
    const booking = new Booking({
      customer: req.user._id,
      carwash: carwash._id,
      service: {
        name: service.name,
        price: service.price,
        duration: service.duration,
      },
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      payment: {
        amount: service.price,
        currency: "usd",
      },
    });

    await booking.save();

    // Create Stripe payment intent
    try {
      const paymentIntent = await createPaymentIntent(service.price, "usd", {
        bookingId: booking._id.toString(),
        customerId: req.user._id.toString(),
        carwashId: carwash._id.toString(),
        service: service.name,
      });

      // Update booking with payment intent ID
      booking.payment.paymentIntentId = paymentIntent.paymentIntentId;
      await booking.save();

      res.status(201).json({
        booking,
        payment: {
          clientSecret: paymentIntent.clientSecret,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        },
      });
    } catch (paymentError) {
      // If payment fails, delete the booking
      await Booking.findByIdAndDelete(booking._id);
      return res.status(400).json({
        message: "Payment processing failed",
        error: paymentError.message,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Confirm payment and update booking status
 */
export const confirmBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns this booking
    if (!booking.customer.equals(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Confirm payment with Stripe
    const isPaymentSuccessful = await confirmPayment(
      booking.payment.paymentIntentId
    );

    if (isPaymentSuccessful) {
      booking.payment.status = "paid";
      booking.status = "pending"; // Ready for owner acceptance
      await booking.save();

      res.json({
        message: "Payment confirmed successfully",
        booking,
      });
    } else {
      booking.payment.status = "failed";
      await booking.save();

      res.status(400).json({
        message: "Payment failed or not confirmed",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Owner sees bookings for their carwashes
 */
export const ownerBookings = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const carwashes = await Carwash.find({ owner: req.user._id }).select("_id");
    const carwashIds = carwashes.map((c) => c._id);

    const bookings = await Booking.find({ carwash: { $in: carwashIds } })
      .populate("customer", "name email")
      .populate("carwash", "name location.address")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Customer sees their own bookings
 */
export const customerBookings = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bookings = await Booking.find({ customer: req.user._id })
      .populate("carwash", "name location.address")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id).populate("carwash");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only carwash owner or admin can change status
    if (
      !booking.carwash.owner.equals(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Check if payment was made before accepting
    if (status === "accepted" && booking.payment.status !== "paid") {
      return res.status(400).json({
        message: "Cannot accept booking without payment",
      });
    }

    if (
      !["pending", "accepted", "rejected", "cancelled", "completed"].includes(
        status
      )
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
