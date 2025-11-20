
import express from "express";
import {
  getStatistics,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/adminController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(auth);

// Statistics dashboard
router.get("/statistics", getStatistics);

// User management
router.get("/users", getAllUsers);
router.patch("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);

export default router;
