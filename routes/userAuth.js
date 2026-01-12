import express from "express";
import {
  registerUser,
  loginUser,
  currentUser,
  logoutUser,
  debugAuth,
} from "../controllers/userAuthController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Debug route
router.get("/debug", debugAuth);

// Protected routes (require auth middleware)
router.get("/me", auth, currentUser);
router.post("/logout", logoutUser);

export default router;