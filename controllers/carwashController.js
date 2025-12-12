import Carwash from "../models/Carwash.js";
import User from "../models/User.js";

/**
 * Carwash creates its OWN business account.
 * Only authenticated carwashes or admins can create/update/delete.
 */
export const createCarwash = async (req, res) => {
  try {
    // req.carwash = authenticated business account
    // req.user = authenticated platform admin (optional)

    if (!req.carwash && (!req.user || req.user.role !== "admin")) {
      return res.status(403).json({ message: "Only carwashes or admin allowed" });
    }

    const { name, description, address, lng, lat, services, workingHours } =
      req.body;

    if (!name || !address || !lng || !lat) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const carwash = new Carwash({
      businessName: name,
      description,
      address,
      location: {
        address,
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
      },
      services: services || [],
      workingHours: workingHours || undefined,

      // new system: carwash owns itself
      ownerName: req.carwash ? req.carwash.ownerName : "Admin",
    });

    await carwash.save();
    res.status(201).json(carwash);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCarwash = async (req, res) => {
  try {
    const { id } = req.params;
    const carwash = await Carwash.findById(id);

    if (!carwash) return res.status(404).json({ message: "Not found" });

    res.json(carwash);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Only the logged-in carwash can modify its own business
 * Admin can modify anyone.
 */
export const updateCarwash = async (req, res) => {
  try {
    const { id } = req.params;
    const carwash = await Carwash.findById(id);

    if (!carwash) return res.status(404).json({ message: "Not found" });

    // Check permissions
    const isAdmin = req.user && req.user.role === "admin";

    if (!isAdmin && (!req.carwash || req.carwash._id.toString() !== id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    Object.assign(carwash, req.body);
    await carwash.save();

    res.json(carwash);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const listNearby = async (req, res) => {
  try {
    const { lng, lat, radius = 5000, limit = 20 } = req.query;

    if (lng && lat) {
      const lngNum = parseFloat(lng);
      const latNum = parseFloat(lat);

      const carwashes = await Carwash.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lngNum, latNum] },
            distanceField: "distance",
            spherical: true,
            maxDistance: parseInt(radius),
          },
        },
        { $limit: parseInt(limit) },
      ]);

      return res.json(carwashes);
    }

    // fallback: return all carwashes
    const carwashes = await Carwash.find();
    res.json(carwashes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
