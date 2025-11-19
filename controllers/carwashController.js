import Carwash from "../models/Carwash.js";
import User from "../models/User.js";

export const createCarwash = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only owners can create carwashes" });
    }

    const { name, description, address, lng, lat, services, workingHours } =
      req.body;
    if (!name || !address || !lng || !lat)
      return res.status(400).json({ message: "Missing fields" });

    const carwash = new Carwash({
      owner: req.user._id,
      name,
      description,
      location: {
        address,
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
      },
      services: services || [],
      workingHours: workingHours || undefined,
    });

    await carwash.save();

    // push carwash id to user.carwashes
    req.user.carwashes.push(carwash._id);
    await req.user.save();

    res.status(201).json(carwash);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCarwash = async (req, res) => {
  try {
    const { id } = req.params;
    const carwash = await Carwash.findById(id).populate("owner", "name email");
    if (!carwash) return res.status(404).json({ message: "Not found" });
    res.json(carwash);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCarwash = async (req, res) => {
  try {
    const { id } = req.params;
    const carwash = await Carwash.findById(id);
    if (!carwash) return res.status(404).json({ message: "Not found" });

    // only owner or admin
    if (!carwash.owner.equals(req.user._id) && req.user.role !== "admin") {
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
      // return nearby carwashes
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

    // if no lng & lat → return all carwashes
    const carwashes = await Carwash.find().populate("owner", "name email");
    res.json(carwashes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
