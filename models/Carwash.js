  import mongoose from "mongoose";

  const carwashSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true },
    description: { type: String },

    location: {
      address: { type: String, required: true },

      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
    },

    services: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        duration: { type: Number },
      },
    ],

    workingHours: {
      open: { type: String, default: "09:00" },
      close: { type: String, default: "20:00" },
    },

    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    available: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
  });


  carwashSchema.index({ "location.coordinates": "2dsphere" });

  export default mongoose.model("Carwash", carwashSchema);
