// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Carwash from "../models/Carwash.js";

export const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.type === "carwash") {
      const carwash = await Carwash.findById(payload.id).select("-password");
      if (!carwash)
        return res.status(401).json({ message: "Invalid token carwash" });

      req.carwash = carwash;
    } else {
      const user = await User.findById(payload.id).select("-password");
      if (!user)
        return res.status(401).json({ message: "Invalid token user" });

      req.user = user;
    }

    next();
  } catch {
    return res.status(401).json({ message: "Token verification failed" });
  }
};
