import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";

// AUTH ROUTES
import googleAuthRoutes from "./routes/auth.js";
import userAuthRoutes from "./routes/userAuth.js";
import carwashAuthRoutes from "./routes/carwashAuth.js";

// OTHER ROUTES
import carwashRoutes from "./routes/carwash.js";
import bookingRoutes from "./routes/booking.js";
import adminRoutes from "./routes/admin.js";
import stripeRoutes from "./routes/stripe.js";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const app = express();

  /* =========================
     CORS — MUST BE FIRST
  ========================== */
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://cs2-hm11-beta.vercel.app",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Allow preflight requests
  app.options("*", cors());

  /* =========================
     STRIPE WEBHOOK (RAW BODY)
     MUST BE BEFORE express.json
  ========================== */
  app.use("/api/stripe", stripeRoutes);

  /* =========================
     BODY + AUTH MIDDLEWARE
  ========================== */
  app.use(express.json());
  app.use(passport.initialize());

  /* =========================
     AUTH ROUTES
  ========================== */
  app.use("/api/auth/google", googleAuthRoutes);
  app.use("/api/users", userAuthRoutes);
  app.use("/api/carwash/auth", carwashAuthRoutes);

  /* =========================
     MODULE ROUTES
  ========================== */
  app.use("/api/carwash", carwashRoutes);
  app.use("/api/booking", bookingRoutes);
  app.use("/api/admin", adminRoutes);

  /* =========================
     HEALTH CHECK
  ========================== */
  app.get("/", (_, res) => res.json({ ok: true }));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
