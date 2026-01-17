import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../config/db.js";
import passport from "../config/passport.js";

// AUTH ROUTES
import googleAuthRoutes from "../routes/auth.js";
import userAuthRoutes from "../routes/userAuth.js";
import carwashAuthRoutes from "../routes/carwashAuth.js";

// OTHER ROUTES
import carwashRoutes from "../routes/carwash.js";
import bookingRoutes from "../routes/booking.js";
import adminRoutes from "../routes/admin.js";
import stripeRoutes from "../routes/stripe.js"


dotenv.config();

const app = express();

/* =========================
   DB CONNECTION (CACHED)
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
   CORS (CORRECT – NO WILDCARDS)
========================= */
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://cs2-hm11-beta.vercel.app",
    "https://sng-1.vercel.app",
    "https://car4wash.vercel.app",
    "https://spotless-rose.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

/* =========================
   MIDDLEWARE (ORDER MATTERS)
========================= */
app.use(cookieParser());
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
   DEBUG
========================= */
app.get("/api/debug/cookies", (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
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
    message: "Something went wrong",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

/* =========================
   EXPORT (SERVERLESS SAFE)
========================= */
export default app;
