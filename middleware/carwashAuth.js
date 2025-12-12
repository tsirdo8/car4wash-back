import jwt from "jsonwebtoken";
import Carwash from "../models/Carwash.js";
import dotenv from "dotenv";
dotenv.config();

export const carwashAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for carwash
    if (payload.type !== "carwash") {
      return res.status(401).json({ message: "Invalid token type" });
    }

    const carwash = await Carwash.findById(payload.id).select("-password");
    if (!carwash) {
      return res.status(401).json({ message: "Invalid token carwash" });
    }

    req.carwash = carwash; // attach carwash to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token verification failed" });
  }
};
