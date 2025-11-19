import Booking from "../models/Booking.js";
import Carwash from "../models/Carwash.js";

/**
 * Customer creates booking
 */
export const createBooking = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      // you may allow owners to create bookings for testing, optional
    }

    const { carwashId, serviceId, scheduledTime } = req.body;
    if (!carwashId || !serviceId)
      return res.status(400).json({ message: "Missing fields" });

    const carwash = await Carwash.findById(carwashId);
    if (!carwash) return res.status(404).json({ message: "Carwash not found" });

    const service =
      carwash.services.id(serviceId) ||
      carwash.services.find(
        (s) => s.name === serviceId || String(s._id) === String(serviceId)
      );
    if (!service) return res.status(400).json({ message: "Service not found" });

    const booking = new Booking({
      customer: req.user._id,
      carwash: carwash._id,
      service: {
        name: service.name,
        price: service.price,
        duration: service.duration,
      },
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
    });

    await booking.save();

    // Optionally: notify owner via Socket/Push

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Owner sees bookings for their carwashes
 */
export const ownerBookings = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // find bookings where carwash.owner == req.user._id
    const carwashes = await Carwash.find({ owner: req.user._id }).select("_id");
    const ids = carwashes.map((c) => c._id);

    const bookings = await Booking.find({ carwash: { $in: ids } })
      .populate("customer", "name email")
      .populate("carwash", "name");
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await Booking.findById(id).populate("carwash");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // only carwash owner or admin can change status
    if (
      !booking.carwash.owner.equals(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (
      !["pending", "accepted", "rejected", "cancelled", "completed"].includes(
        status
      )
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    booking.status = status;
    await booking.save();

    // Optionally notify customer

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
