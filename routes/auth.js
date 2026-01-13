import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Remove cookie helper entirely — we don't need it anymore for this flow
// (You can keep it if you use cookies elsewhere, but not here)

// Google OAuth login — unchanged
router.get(
  "/",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google OAuth callback — FIXED
router.get(
  "/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    try {
      if (!req.user) {
        throw new Error("No user after authentication");
      }

      const token = generateToken(req.user);

      // Build safe redirect URL with token in query param
      const redirectUrl = new URL(`${process.env.FRONTEND_URL}/dashboard`);
      redirectUrl.searchParams.set("token", token);

      // Optional: pass minimal non-sensitive info (helps avoid immediate /me call)
      // redirectUrl.searchParams.set("name", encodeURIComponent(req.user.name || ""));
      // redirectUrl.searchParams.set("email", encodeURIComponent(req.user.email || ""));

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

export default router;