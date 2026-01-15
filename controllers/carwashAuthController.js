import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Carwash from "../models/Carwash.js";
import { v2 as cloudinary } from "cloudinary";

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

    const exists = await Carwash.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

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
          coordinates: location.coordinates.coordinates,
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

    const carwash = await Carwash.findOne({ email }).select("+password");
    if (!carwash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, carwash.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createCarwashToken(carwash);

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

// Get current carwash
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
    images: req.carwash.images || [],
    type: "carwash",
  });
};

// Update carwash profile (text fields)
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
      images: updated.images || [],
      type: "carwash",
    });
  } catch (err) {
    console.error("Update carwash error:", err.message, err.stack);
    res.status(500).json({ message: "Server error during update" });
  }
};

// Upload images – explicit credentials per upload
export const uploadCarwashImages = async (req, res) => {
  console.log("=== IMAGE UPLOAD START ===");
  console.log("Time:", new Date().toISOString());
  console.log("Carwash ID:", req.carwash?._id || "MISSING");
  console.log("Files count:", req.files?.length || 0);

  try {
    if (!req.carwash) {
      console.log("ERROR: No req.carwash");
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.files || req.files.length === 0) {
      console.log("ERROR: No files received");
      return res.status(400).json({ message: "No files uploaded" });
    }

    console.log("First file:", {
      name: req.files[0]?.originalname,
      size: req.files[0]?.size,
      buffer: !!req.files[0]?.buffer,
    });

    const imageUrls = [];

    for (const file of req.files) {
      console.log(`Uploading file: ${file.originalname}`);

      if (!file.buffer) {
        console.log("ERROR: No buffer");
        throw new Error("File buffer missing");
      }

      const result = await new Promise((resolve, reject) => {
        console.log("Starting Cloudinary upload...");
        cloudinary.uploader.upload_stream(
          {
            folder: "car4wash",
            resource_type: "image",
            // Explicit credentials – fixes Vercel/serverless config issues
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary error:", error.message);
              reject(error);
            } else {
              console.log("Cloudinary success:", result.secure_url);
              resolve(result);
            }
          }
        ).end(file.buffer); // send buffer directly
      });

      imageUrls.push(result.secure_url);
    }

    console.log("Uploads done. Saving:", imageUrls);

    const updated = await Carwash.findByIdAndUpdate(
      req.carwash._id,
      { $push: { images: { $each: imageUrls } } },
      { new: true, select: "images" }
    );

    if (!updated) {
      console.log("ERROR: Carwash not found");
      return res.status(404).json({ message: "Carwash not found" });
    }

    console.log("DB saved. Images:", updated.images.length);

    res.status(200).json({
      message: `Uploaded ${imageUrls.length} image(s)`,
      images: updated.images,
    });
  } catch (err) {
    console.error("=== UPLOAD CRASH ===");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ message: "Server error during image upload" });
  }
};

// Delete single image
export const deleteCarwashImage = async (req, res) => {
  try {
    if (!req.carwash) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const updated = await Carwash.findByIdAndUpdate(
      req.carwash._id,
      { $pull: { images: imageUrl } },
      { new: true, select: "images" }
    );

    // Optional: delete from Cloudinary
    try {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`car4wash/${publicId}`, {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    } catch (cloudErr) {
      console.warn("Cloudinary delete failed:", cloudErr.message);
    }

    res.json({
      message: "Image deleted",
      images: updated?.images || [],
    });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ message: "Failed to delete image" });
  }
};

// Logout
export const logoutCarwash = (req, res) => {
  res.json({ message: "Logged out successfully" });
};