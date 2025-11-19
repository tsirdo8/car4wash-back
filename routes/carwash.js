import express from "express";
import {
  createCarwash,
  getCarwash,
  updateCarwash,
  listNearby,
} from "../controllers/carwashController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createCarwash); // owner creates carwash
router.get("/:id", getCarwash);
router.patch("/:id", auth, updateCarwash);
router.get("/", listNearby); // e.g. GET /api/carwash?lng=...&lat=...

export default router;
