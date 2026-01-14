// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Carwash from "../models/Carwash.js";

export const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  console.log("[AUTH MIDDLEWARE] Authorization header:", header || "MISSING");

  if (!header?.startsWith("Bearer ")) {
    console.log("[AUTH] No Bearer token found");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];
  console.log("[AUTH] Token (first 30 chars):", token.substring(0, 30) + "...");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[AUTH] Payload:", JSON.stringify(payload, null, 2));

    if (payload.type === "carwash") {
      console.log("[AUTH] Type is carwash → looking up ID:", payload.id);
      const carwash = await Carwash.findById(payload.id).select("-password");
      console.log("[AUTH] Carwash lookup result:", carwash ? "FOUND" : "NOT FOUND");

      if (!carwash) {
        console.log("[AUTH] Carwash document not found for ID:", payload.id);
        return res.status(401).json({ message: "Invalid token carwash" });
      }

      req.carwash = carwash;
    } else {
      console.log("[AUTH] Type is not carwash → looking up user ID:", payload.id);
      const user = await User.findById(payload.id).select("-password");
      console.log("[AUTH] User lookup result:", user ? "FOUND" : "NOT FOUND");

      if (!user) {
        return res.status(401).json({ message: "Invalid token user" });
      }

      req.user = user;
    }

    console.log("[AUTH] Success → calling next()");
    next();
  } catch (err) {
    console.error("[AUTH ERROR]", err.message);
    return res.status(401).json({ message: `Token verification failed: ${err.message}` });
  }
};