// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

console.log("🎯 PASSPORT.JS FILE IS NOW EXECUTING!");

// Create and configure the Google strategy
const configurePassport = () => {
  console.log("🔧 Configuring Google OAuth strategy...");

  const googleStrategy = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_REDIRECT_URL ||
        "http://localhost:5000/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(
          "🔑 Google OAuth callback executed for:",
          profile.emails[0].value
        );

        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;
        const avatar = photos[0]?.value;

        // Find or create user
        let user = await User.findOne({
          $or: [{ googleId: id }, { email }],
        });

        if (user) {
          // Update existing user
          if (!user.googleId) {
            user.googleId = id;
            await user.save();
          }
          console.log("✅ Existing user:", user.email);
        } else {
          // Create new user
          user = await User.create({
            googleId: id,
            name: displayName,
            email: email,
            role: "customer",
          });
          console.log("✅ New user created:", user.email);
        }

        return done(null, user);
      } catch (error) {
        console.error("❌ Google OAuth error:", error);
        return done(error, null);
      }
    }
  );

  // Register the strategy with explicit name
  passport.use("google", googleStrategy);
  console.log("✅ Google strategy registered successfully!");

  // Serialize/Deserialize
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  console.log("🎯 Passport configuration completed!");
  return passport;
};

// Initialize and export
const configuredPassport = configurePassport();
export default configuredPassport;
