import Booking from "../models/Booking.js";
import Carwash from "../models/Carwash.js";
import { createPaymentIntent } from "../services/stripeService.js";
import nodemailer from "nodemailer";



// Create reusable transporter (do this once, outside functions)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, // Use App Password, not regular password!
  },
});

// Function to send email
const sendBookingNotification = async (booking, carwash) => {
  try {
    await transporter.sendMail({
      from: `"Car4Wash" <${process.env.EMAIL_USER}>`,
      to: carwash.email,
      subject: "New Booking Received",
      html: `
        <h2>New Booking!</h2>
        <p>Customer booked: <strong>${booking.service.name}</strong></p>
        <p>Time: ${new Date(booking.scheduledTime).toLocaleString()}</p>
        <p>Amount: ${booking.service.price} ₾</p>
        <p>Check your dashboard: <a href="https://car4wash.vercel.app/owner-bookings">View Bookings</a></p>
      `,
    });
    console.log("Email sent to carwash owner");
  } catch (err) {
    console.error("Email notification failed:", err);
  }
};
// Check if time slot is available
export const checkAvailability = async (req, res) => {
  const { carwashId, date, time } = req.body;

  try {
    const requestedTime = new Date(`${date}T${time}:00Z`);

    // Find any overlapping booking (same carwash, same exact time)
    const existing = await Booking.findOne({
      carwash: carwashId,
      scheduledTime: requestedTime,
      status: { $in: ["pending", "accepted"] },
    });

    res.json({ available: !existing });
  } catch (err) {
    console.error("Availability check error:", err);
    res.status(500).json({ message: "Failed to check availability" });
  }
};

// Create pending booking + PaymentIntent
export const createBooking = async (req, res) => {
  const { carwashId, serviceId, date, time } = req.body;

  try {
    const requestedTime = new Date(`${date}T${time}:00Z`);

    // Double-check availability (race condition protection)
    const existing = await Booking.findOne({
      carwash: carwashId,
      scheduledTime: requestedTime,
      status: { $in: ["pending", "accepted"] },
    });

    if (existing) {
      return res.status(409).json({ message: "This time slot is already booked" });
    }

    // Find carwash & service price
    const carwash = await Carwash.findById(carwashId);
    if (!carwash) return res.status(404).json({ message: "Carwash not found" });

    const service = carwash.services.id(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const amount = service.price;

    // Create pending booking
    const booking = await Booking.create({
      customer: req.user._id,
      carwash: carwashId,
      service: {
        name: service.name,
        price: service.price,
        duration: service.duration,
      },
      scheduledTime: requestedTime,
      status: "pending",
      payment: {
        status: "pending",
        amount,
        currency: "gel", // or "usd"
      },
    });

    // Create Stripe PaymentIntent
    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      amount,
      "gel",
      { bookingId: booking._id.toString() }
    );

    // Save payment intent ID
    booking.payment.paymentIntentId = paymentIntentId;
    await booking.save();

    // Notify carwash owner via email (async, no await)
    sendBookingNotification(booking, carwash);

    res.status(201).json({
      booking,
      clientSecret,
      paymentIntentId,
    });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

// Customer's bookings
export const customerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate("carwash", "businessName")
      .sort({ scheduledTime: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// Owner's bookings (for their carwashes)
export const ownerBookings = async (req, res) => {
  try {
    const carwashes = await Carwash.find({ owner: req.carwash?._id || req.user._id });
    const carwashIds = carwashes.map(c => c._id);

    const bookings = await Booking.find({ carwash: { $in: carwashIds } })
      .populate("customer", "name email")
      .sort({ scheduledTime: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch owner bookings" });
  }
};

// Owner updates status (accept/reject/complete)
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check ownership
    const carwash = await Carwash.findById(booking.carwash);
    if (carwash.owner.toString() !== req.carwash?._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Failed to update booking" });
  }
};

// Confirm payment (optional manual endpoint)
export const confirmBookingPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const booking = await Booking.findOne({ "payment.paymentIntentId": paymentIntentId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.payment.status = "paid";
    booking.status = "pending";
    await booking.save();

    res.json({ message: "Payment confirmed", booking });
  } catch (err) {
    res.status(500).json({ message: "Failed to confirm payment" });
  }
};