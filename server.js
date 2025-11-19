import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import carwashRoutes from "./routes/carwash.js";
import bookingRoutes from "./routes/booking.js";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(passport.initialize());

  // API namespace
  app.use("/api/auth", authRoutes);
  app.use("/api/carwash", carwashRoutes);
  app.use("/api/booking", bookingRoutes);

  // health
  app.get("/", (_, res) => res.send({ ok: true }));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
};

startServer();
