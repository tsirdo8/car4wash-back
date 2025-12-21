import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false; // global cached connection

const connectDB = async () => {
  if (isConnected) {
    console.log("✅ MongoDB already connected");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err; // let function fail properly if DB can't connect
  }
};

export default connectDB;
