// models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  carwash: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Carwash",
    required: true,
  },
  service: {
    name: String,
    price: Number,
    duration: Number,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
    default: "pending",
  },
  payment: {
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentIntentId: String,
    amount: Number,
    currency: {
      type: String,
      default: "usd",
    },
  },
  scheduledTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", bookingSchema);
