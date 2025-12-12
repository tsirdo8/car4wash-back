import express from "express";
import { registerUser, loginUser, currentUserUser } from "../controllers/userAuthController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", auth, currentUserUser);

export default router;
