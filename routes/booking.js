import express from "express";
import {
  createBooking,
  ownerBookings,
  customerBookings,
  updateBookingStatus,
  confirmBookingPayment,
  checkAvailability,
} from "../controllers/bookingController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Public / Customer routes
router.post("/check-availability", auth, checkAvailability);     // Check if time slot is free
router.post("/", auth, createBooking);                           // Create pending booking
router.get("/my-bookings", auth, customerBookings);              // Customer's bookings
router.post("/confirm-payment", auth, confirmBookingPayment);    // Optional: manual confirm if needed

// Owner routes
router.get("/owner", auth, ownerBookings);                       // Owner sees bookings for their carwashes
router.patch("/:id/status", auth, updateBookingStatus);          // Accept/reject/complete

export default router;