import express from "express";
import { registerCarwash, loginCarwash, currentUserCarwash } from "../controllers/carwashAuthController.js";
import { carwashAuth } from "../middleware/carwashAuth.js";
const router = express.Router();

router.post("/register", registerCarwash);
router.post("/login", loginCarwash);
router.get("/me", carwashAuth, currentUserCarwash);

export default router;
