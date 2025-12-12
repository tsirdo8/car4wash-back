import mongoose from "mongoose";

const carwashSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  ownerName: { type: String, required: true },
  
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  phone: { type: String },

location: {
  address: {
    type: String,
    required: true,
    default: "Address to be updated"
  },
  coordinates: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0]           // ← THIS LINE IS MANDATORY
    }
  }
},
  services: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      duration: Number,
    },
  ],

  workingHours: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "20:00" },
  },

  createdAt: { type: Date, default: Date.now },
});

carwashSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.model("Carwash", carwashSchema);
