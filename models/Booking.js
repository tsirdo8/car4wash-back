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

  scheduledTime: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", bookingSchema);
