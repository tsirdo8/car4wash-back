import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import carwashRoutes from "./routes/carwash.js";
import bookingRoutes from "./routes/booking.js";
import adminRoutes from "./routes/admin.js";
import stripeRoutes from "./routes/stripe.js"; // Add this import

dotenv.config();

const startServer = async () => {
  await connectDB();

  const app = express();

  // 🚨 IMPORTANT: Webhook must come BEFORE express.json() and cors()
  // Stripe webhook needs the raw body, not parsed JSON
  app.use("/api/stripe", stripeRoutes);

  // Now add all other middleware
  app.use(cors());
  app.use(express.json());
  app.use(passport.initialize());

  // API namespace
  app.use("/api/auth", authRoutes);
  app.use("/api/carwash", carwashRoutes);
  app.use("/api/booking", bookingRoutes);
  app.use("/api/admin", adminRoutes);

  // health
  app.get("/", (_, res) => res.send({ ok: true }));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(
      `🔔 Stripe webhook ready at: http://localhost:${PORT}/api/stripe/webhook`
    );
  });
};

startServer();
