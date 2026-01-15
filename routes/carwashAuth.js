// routes/carwashAuth.js
import express from "express";
import upload from "../middleware/upload.js"; // your multer config
import { auth } from "../middleware/auth.js"; // your general auth middleware

import {
  registerCarwash,
  loginCarwash,
  currentUserCarwash,
  updateCarwash,
  uploadCarwashImages,
  deleteCarwashImage,
} from "../controllers/carwashAuthController.js";

const router = express.Router();

router.post("/register", registerCarwash);
router.post("/login", loginCarwash);
router.get("/me", auth, currentUserCarwash);
router.put("/update", auth, updateCarwash);

// NEW: Upload images (multiple files allowed)
router.post("/upload-images", auth, upload.array("images", 10), uploadCarwashImages);

// NEW: Delete image
router.delete("/delete-image", auth, deleteCarwashImage);

export default router;