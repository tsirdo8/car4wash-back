import express from "express";
import { registerCarwash, loginCarwash, currentUserCarwash } from "../controllers/carwashAuthController.js";
import { auth } from "../middleware/carwashAuth.js";
const router = express.Router();

router.post("/register", registerCarwash);
router.post("/login", loginCarwash);
router.get("/me", auth, currentUserCarwash);

export default router;
