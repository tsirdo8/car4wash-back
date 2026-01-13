import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../config/db.js";
import passport from "../config/passport.js";

// ROUTES
import googleAuthRoutes from "../routes/auth.js";
import userAuthRoutes from "../routes/userAuth.js";
import carwashAuthRoutes from "../routes/carwashAuth.js";
import carwashRoutes from "../routes/carwash.js";
import bookingRoutes from "../routes/booking.js";
import adminRoutes from "../routes/admin.js";
import stripeRoutes from "../routes/stripe.js";

dotenv.config();

const app = express();

/* =========================
   DB CONNECTION (SAFE)
========================= */
let isConnected = false;
const connectOnce = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};
connectOnce();

/* =========================
   CORS (🔥 CORRECT VERSION)
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://cs2-hm11-beta.vercel.app",
  "https://sng-1.vercel.app",
  "https://car4wash.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / Postman / curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, origin); // 🔥 MUST return exact origin
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

/* =========================
   MIDDLEWARE (ORDER MATTERS)
========================= */
app.use(cookieParser());     // 🔥 BEFORE routes
app.use(express.json());
app.use(passport.initialize());

/* =========================
   ROUTES
========================= */
app.use("/api/auth/google", googleAuthRoutes);
app.use("/api/users", userAuthRoutes);
app.use("/api/carwash/auth", carwashAuthRoutes);

app.use("/api/carwash", carwashRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stripe", stripeRoutes);

/* =========================
   DEBUG (KEEP THIS!)
========================= */
app.get("/api/debug/cookies", (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: {
      origin: req.headers.origin,
      cookie: req.headers.cookie,
    },
  });
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (_, res) => res.json({ ok: true }));

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || "Something went wrong",
  });
});

/* =========================
   EXPORT (VERCEL SAFE)
========================= */
export default app;
