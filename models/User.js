import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String,  },
  phone: { type: String },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
