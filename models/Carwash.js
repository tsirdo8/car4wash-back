import mongoose from "mongoose";

const carwashSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
  },

  ownerName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone: String,

  location: {
    address: {
      type: String,
      required: true,        // ❌ NO DEFAULT
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,      // ❌ NO DEFAULT
        validate: {
          validator: function (v) {
            return Array.isArray(v) && v.length === 2;
          },
          message: "Coordinates must be [lng, lat]",
        },
      },
    },
  },

  services: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      duration: Number,
    },
  ],

  workingHours: {
    open: {
      type: String,
      required: true,        // ❌ NO DEFAULT
    },
    close: {
      type: String,
      required: true,        // ❌ NO DEFAULT
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

carwashSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.model("Carwash", carwashSchema);
