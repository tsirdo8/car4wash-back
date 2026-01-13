// routes/carwashAuth.js
import express from "express";
import { registerCarwash, loginCarwash, currentUserCarwash, updateCarwash } from "../controllers/carwashAuthController.js";
import { auth } from "../middleware/auth.js"; // your existing auth middleware

const router = express.Router();

router.post("/register", registerCarwash);
router.post("/login", loginCarwash);
router.get("/me", auth, currentUserCarwash);
router.put("/update", auth, updateCarwash); // ← new

export default router;