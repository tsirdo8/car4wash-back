import express from "express";
import {
  createBooking,
  ownerBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createBooking); // create booking (customer)
router.get("/owner", auth, ownerBookings); // owner sees bookings
router.patch("/:id/status", auth, updateBookingStatus); // owner updates status

export default router;
