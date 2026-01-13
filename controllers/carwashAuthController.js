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
    const {
      businessName,
      ownerName,
      email,
      password,
      phone,
      location,
      services,
      workingHours,
    } = req.body;

    // Required fields validation
    if (
      !businessName ||
      !ownerName ||
      !email ||
      !password ||
      !location?.address ||
      !location?.coordinates?.coordinates ||
      location.coordinates.coordinates.length !== 2 ||
      !Array.isArray(location.coordinates.coordinates) ||
      !services?.length ||
      !workingHours?.open ||
      !workingHours?.close
    ) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    // Check if email already exists
    const exists = await Carwash.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create carwash
    const carwash = await Carwash.create({
      businessName,
      ownerName,
      email,
      password: hashed,
      phone: phone || "",
      location: {
        address: location.address,
        coordinates: {
          type: "Point",
          coordinates: location.coordinates.coordinates, // [lng, lat]
        },
      },
      services: services.map((s) => ({
        name: s.name,
        price: Number(s.price),
        duration: s.duration || null,
      })),
      workingHours: {
        open: workingHours.open,
        close: workingHours.close,
      },
    });

    const token = createCarwashToken(carwash);

    // Flat response (no nested carwash object)
    res.status(201).json({
      token,
      id: carwash._id,
      businessName: carwash.businessName,
      ownerName: carwash.ownerName,
      email: carwash.email,
      phone: carwash.phone,
      location: carwash.location,
      services: carwash.services,
      workingHours: carwash.workingHours,
      type: "carwash",
    });
  } catch (err) {
    console.error("Carwash registration error:", err.message, err.stack);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login for carwash owner
export const loginCarwash = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user and include password for comparison
    const carwash = await Carwash.findOne({ email }).select("+password");
    if (!carwash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, carwash.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createCarwashToken(carwash);

    // Flat response
    res.json({
      token,
      id: carwash._id,
      businessName: carwash.businessName,
      ownerName: carwash.ownerName,
      email: carwash.email,
      phone: carwash.phone,
      location: carwash.location,
      services: carwash.services,
      workingHours: carwash.workingHours,
      type: "carwash",
    });
  } catch (err) {
    console.error("Carwash login error:", err.message, err.stack);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Get current carwash (protected)
export const currentUserCarwash = (req, res) => {
  if (!req.carwash) {
    return res.status(401).json({ message: "Unauthorized - no carwash data" });
  }

  res.json({
    id: req.carwash._id,
    businessName: req.carwash.businessName,
    ownerName: req.carwash.ownerName,
    email: req.carwash.email,
    phone: req.carwash.phone,
    location: req.carwash.location,
    services: req.carwash.services,
    workingHours: req.carwash.workingHours,
    type: "carwash",
  });
};

// Update carwash profile
export const updateCarwash = async (req, res) => {
  try {
    if (!req.carwash) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { businessName, ownerName, email, phone, password } = req.body;

    const updateData = {};
    if (businessName) updateData.businessName = businessName;
    if (ownerName) updateData.ownerName = ownerName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await Carwash.findByIdAndUpdate(
      req.carwash._id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      id: updated._id,
      businessName: updated.businessName,
      ownerName: updated.ownerName,
      email: updated.email,
      phone: updated.phone,
      type: "carwash",
    });
  } catch (err) {
    console.error("Update carwash error:", err.message, err.stack);
    res.status(500).json({ message: "Server error during update" });
  }
};

// Logout (stateless – just success message)
// Can be expanded later with token blacklisting if needed
export const logoutCarwash = (req, res) => {
  res.json({ message: "Logged out successfully" });
};