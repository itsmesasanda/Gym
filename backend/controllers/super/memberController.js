import User from "../../models/User.js";

const SAFE_FIELDS = "-password -resetCodeHash -resetCodeExpires";

// GET /api/super/members?status=&search=&gymId=
// Every member across every gym, with the owning gym's name/code attached.
export const listAllMembers = async (req, res) => {
  try {
    const { status, search, gymId } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (gymId) filter.gymId = gymId;
    if (search?.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const members = await User.find(filter)
      .select(SAFE_FIELDS)
      .populate("gymId", "name code")
      .sort({ createdAt: -1 });

    res.json(members);
  } catch (err) {
    console.error("[super/listAllMembers]", err);
    res.status(500).json({ message: "Failed to load members" });
  }
};
