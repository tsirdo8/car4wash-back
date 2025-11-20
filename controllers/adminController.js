// controllers/adminController.js
import User from "../models/User.js";
import Carwash from "../models/Carwash.js";
import Booking from "../models/Booking.js";

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin privileges required." });
  }
  next();
};

export const getStatistics = async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: "customer" });
    const owners = await User.countDocuments({ role: "owner" });
    const admins = await User.countDocuments({ role: "admin" });

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get carwash statistics
    const totalCarwashes = await Carwash.countDocuments();
    const availableCarwashes = await Carwash.countDocuments({
      available: true,
    });
    const unavailableCarwashes = await Carwash.countDocuments({
      available: false,
    });

    // Get booking statistics
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const acceptedBookings = await Booking.countDocuments({
      status: "accepted",
    });
    const completedBookings = await Booking.countDocuments({
      status: "completed",
    });
    const rejectedBookings = await Booking.countDocuments({
      status: "rejected",
    });
    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled",
    });

    // Revenue statistics
    let totalRevenue = 0;
    try {
      const revenueResult = await Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$service.price" } } },
      ]);
      totalRevenue = revenueResult[0]?.totalRevenue || 0;
    } catch (revenueError) {
      console.log("Revenue calculation skipped:", revenueError.message);
    }

    // Recent activities - NO POPULATION to avoid errors
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt");

    // Get recent bookings without population first
    const recentBookingsRaw = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("customer carwash service status scheduledTime createdAt");

    // Manually populate the data to avoid population errors
    const recentBookings = await Promise.all(
      recentBookingsRaw.map(async (booking) => {
        const customer = await User.findById(booking.customer).select(
          "name email"
        );
        const carwash = await Carwash.findById(booking.carwash).select(
          "name location.address"
        );
        return {
          _id: booking._id,
          customer: customer || { name: "Unknown Customer", email: "N/A" },
          carwash: carwash || {
            name: "Unknown Carwash",
            location: { address: "N/A" },
          },
          service: booking.service,
          status: booking.status,
          scheduledTime: booking.scheduledTime,
          createdAt: booking.createdAt,
        };
      })
    );

    // Get recent carwashes with manual population
    const recentCarwashesRaw = await Carwash.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name location.address available rating createdAt owner");

    const recentCarwashes = await Promise.all(
      recentCarwashesRaw.map(async (carwash) => {
        const owner = await User.findById(carwash.owner).select("name email");
        return {
          _id: carwash._id,
          name: carwash.name,
          location: carwash.location,
          available: carwash.available,
          rating: carwash.rating,
          createdAt: carwash.createdAt,
          owner: owner || { name: "Unknown Owner", email: "N/A" },
        };
      })
    );

    res.json({
      overview: {
        totalUsers,
        totalCarwashes,
        totalBookings,
        totalRevenue,
        newUsersLast30Days,
      },
      users: {
        total: totalUsers,
        customers,
        owners,
        admins,
        growth: newUsersLast30Days,
      },
      carwashes: {
        total: totalCarwashes,
        available: availableCarwashes,
        unavailable: unavailableCarwashes,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        accepted: acceptedBookings,
        completed: completedBookings,
        rejected: rejectedBookings,
        cancelled: cancelledBookings,
      },
      recent: {
        users: recentUsers,
        bookings: recentBookings,
        carwashes: recentCarwashes,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin statistics error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    if (role && role !== "all") filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get additional data based on user role
    let userBookings = [];
    let ownedCarwashes = [];

    if (user.role === "customer") {
      // Get bookings where this user is the customer
      const bookingsRaw = await Booking.find({ customer: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("carwash service status scheduledTime createdAt");

      userBookings = await Promise.all(
        bookingsRaw.map(async (booking) => {
          const carwash = await Carwash.findById(booking.carwash).select(
            "name location.address"
          );
          return {
            _id: booking._id,
            carwash: carwash || { name: "Unknown Carwash" },
            service: booking.service,
            status: booking.status,
            scheduledTime: booking.scheduledTime,
            createdAt: booking.createdAt,
          };
        })
      );
    } else if (user.role === "owner") {
      // Get carwashes owned by this user
      ownedCarwashes = await Carwash.find({ owner: userId }).select(
        "name location.address available rating createdAt"
      );

      // Get bookings for owner's carwashes
      const carwashIds = ownedCarwashes.map((cw) => cw._id);
      const bookingsRaw = await Booking.find({ carwash: { $in: carwashIds } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("customer carwash service status scheduledTime createdAt");

      userBookings = await Promise.all(
        bookingsRaw.map(async (booking) => {
          const customer = await User.findById(booking.customer).select(
            "name email"
          );
          const carwash = await Carwash.findById(booking.carwash).select(
            "name location.address"
          );
          return {
            _id: booking._id,
            customer: customer || { name: "Unknown Customer" },
            carwash: carwash || { name: "Unknown Carwash" },
            service: booking.service,
            status: booking.status,
            scheduledTime: booking.scheduledTime,
            createdAt: booking.createdAt,
          };
        })
      );
    }

    res.json({
      user,
      bookings: userBookings,
      ownedCarwashes,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["customer", "owner", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.id) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user's carwashes if they were an owner
    if (user.role === "owner") {
      await Carwash.deleteMany({ owner: userId });
    }

    // Delete user's bookings (as customer)
    await Booking.deleteMany({ customer: userId });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
