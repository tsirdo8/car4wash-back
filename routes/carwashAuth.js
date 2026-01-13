import express from "express";
import {
  registerCarwash,
  loginCarwash,
  currentUserCarwash,
  updateCarwash,
  logoutCarwash,
} from "../controllers/carwashAuthController.js";
import { auth } from "../middleware/auth.js"; // your existing middleware

const router = express.Router();

router.post("/register", registerCarwash);
router.post("/login", loginCarwash);
router.get("/me", auth, currentUserCarwash);
router.put("/update", auth, updateCarwash);
router.post("/logout", logoutCarwash); // optional but recommended

export default router;