import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log(" MongoDB Connected");
  } catch (err) {
    console.error("Error: ", err.message);
  }
};

export default connectDB;
