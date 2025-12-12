import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Carwash from "../models/Carwash.js";

// Generate JWT for carwash owner
const createCarwashToken = (carwash) => {
  return jwt.sign(
    { id: carwash._id, type: "carwash", email: carwash.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Register new carwash
export const registerCarwash = async (req, res) => {
  try {
    const { businessName, ownerName, email, password, phone } = req.body;
    if (!businessName || !ownerName || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Check if email already exists
    const exists = await Carwash.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const carwash = new Carwash({
      businessName,
      ownerName,
      email,
      password: hashed,
      phone,
    });

    await carwash.save();

    const token = createCarwashToken(carwash);

    res.status(201).json({
      token,
      carwash: {
        id: carwash._id,
        businessName: carwash.businessName,
        ownerName: carwash.ownerName,
        email: carwash.email,
        phone: carwash.phone,
      },
    });
  } catch (err) {
    console.error("❌ Carwash registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login for carwash owner
export const loginCarwash = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const carwash = await Carwash.findOne({ email });
    if (!carwash) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, carwash.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = createCarwashToken(carwash);

    res.json({
      token,
      carwash: {
        id: carwash._id,
        businessName: carwash.businessName,
        ownerName: carwash.ownerName,
        email: carwash.email,
        phone: carwash.phone,
      },
    });
  } catch (err) {
    console.error("❌ Carwash login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get current carwash (protected)
export const currentUserCarwash = (req, res) => {
  if (!req.carwash)
    return res.status(401).json({ message: "Unauthorized" });

  res.json({
    carwash: {
      id: req.carwash._id,
      businessName: req.carwash.businessName,
      ownerName: req.carwash.ownerName,
      email: req.carwash.email,
      phone: req.carwash.phone,
    },
  });
};
