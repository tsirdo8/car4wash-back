// middleware/auth.js
export const auth = async (req, res, next) => {
  try {
    console.log("=== AUTH MIDDLEWARE DEBUG ===");
    console.log("Cookies:", req.cookies);
    console.log("Authorization header:", req.headers.authorization);
    console.log("Origin:", req.headers.origin);
    
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("Token found:", token ? "YES" : "NO");
    
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token payload:", payload);

    // Find user/carwash
    let currentUser;
    if (payload.role === "customer" || payload.role === "admin") {
      currentUser = await User.findById(payload.id).select("-password");
    } else if (payload.role === "carwash") {
      currentUser = await Carwash.findById(payload.id).select("-password");
    }

    if (!currentUser) {
      console.log("User not found for payload:", payload);
      return res.status(401).json({ message: "Invalid token - User not found" });
    }

    console.log("Auth successful for:", currentUser.email);
    req.user = currentUser;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ message: "Token verification failed" });
  }
};