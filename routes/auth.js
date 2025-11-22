// routes/auth.js
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { register, login, currentUser } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Local authentication
router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, currentUser);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // We're using JWT, not sessions
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);

     
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

export default router;
