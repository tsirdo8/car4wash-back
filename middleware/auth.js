// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Carwash from "../models/Carwash.js";

export const auth = async (req, res, next) => {
  try {
    console.log("=== AUTH MIDDLEWARE DEBUG ===");
    console.log("Cookies:", req.cookies);
    console.log("Authorization header:", req.headers.authorization);

    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET IS NOT SET");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    let currentUser;
    if (payload.role === "customer" || payload.role === "admin") {
      currentUser = await User.findById(payload.id).select("-password");
    } else if (payload.role === "carwash") {
      currentUser = await Carwash.findById(payload.id).select("-password");
    }

    if (!currentUser) {
      return res.status(401).json({ message: "Invalid token - User not found" });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err.message);
    res.status(401).json({ message: "Token verification failed" });
  }
};
