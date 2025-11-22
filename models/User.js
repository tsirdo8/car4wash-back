import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String },

  password: { type: String }, 
  // owner may have multiple carwashes
  carwashes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Carwash" }],

  role: {
    type: String,
    enum: ["customer", "owner", "admin"],
    default: "customer",
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
