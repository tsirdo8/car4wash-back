import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";

// AUTH ROUTES (SEPARATED)
import googleAuthRoutes from "./routes/auth.js";          // ONLY Google OAuth
import userAuthRoutes from "./routes/userAuth.js";        // Customers
import carwashAuthRoutes from "./routes/carwashAuth.js";  // Carwash Owners

// OTHER ROUTES
import carwashRoutes from "./routes/carwash.js";
import bookingRoutes from "./routes/booking.js";
import adminRoutes from "./routes/admin.js";
import stripeRoutes from "./routes/stripe.js";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const app = express();

  // Stripe webhook (raw body)
  app.use("/api/stripe", stripeRoutes);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(passport.initialize());

  // AUTH ROUTES
  app.use("/api/auth/google", googleAuthRoutes);   // Google login only
  app.use("/api/users", userAuthRoutes);           // Customer register/login
  app.use("/api/carwash/auth", carwashAuthRoutes); // Carwash owner auth

  // OTHER MODULE ROUTES
  app.use("/api/carwash", carwashRoutes);
  app.use("/api/booking", bookingRoutes);
  app.use("/api/admin", adminRoutes);

  // health check
  app.get("/", (_, res) => res.send({ ok: true }));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
