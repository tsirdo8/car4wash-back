import express from "express";
import { auth } from "../middleware/auth.js";
import {
  registerUser,
  loginUser,
  currentUser,
  logoutUser,
  debugAuth,
  updateUser,   // import the new endpoint
} from "../controllers/userAuthController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", auth, currentUser);
router.post("/logout", auth, logoutUser);
router.put("/update", auth, updateUser);

router.get("/debug", debugAuth);

export default router;
