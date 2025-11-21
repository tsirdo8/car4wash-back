// routes/booking.js
import express from "express";
import {
  createBooking,
  ownerBookings,
  customerBookings,
  updateBookingStatus,
  confirmBookingPayment,
} from "../controllers/bookingController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Customer routes
router.post("/", auth, createBooking); // Create booking with payment
router.get("/my-bookings", auth, customerBookings); // Customer sees their bookings
router.post("/confirm-payment", auth, confirmBookingPayment); // Confirm payment

// Owner routes
router.get("/owner", auth, ownerBookings); // Owner sees bookings for their carwashes
router.patch("/:id/status", auth, updateBookingStatus); // Owner updates status

export default router;
