import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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
import stripeRoutes from "../routes/stripe.js";

dotenv.config();

const app = express();

/* =========================
   DB CONNECTION (cached)
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
   CORS
========================= */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://cs2-hm11-beta.vercel.app",
    "https://sng-1.vercel.app"    // ✅ add this
  ],
  credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


/* =========================
   STRIPE (RAW BODY)
========================= */
app.use("/api/stripe", stripeRoutes);

/* =========================
   MIDDLEWARE
========================= */
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

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (_, res) => res.json({ ok: true }));

/* =========================
   EXPORT (NO app.listen!)
========================= */
export default app;
