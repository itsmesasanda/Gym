import Event from "../models/Event.js";
import { validateEventData } from "../utils/contentValidation.js";

const validationError = (res, errors) =>
  res.status(400).json({ error: "Validation failed", errors });

export const getAllEvents = async (_req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error("[getAllEvents] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const validation = validateEventData(req.body);
    if (!validation.isValid) return validationError(res, validation.errors);

    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    console.error("[createEvent] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const validation = validateEventData(req.body);
    if (!validation.isValid) return validationError(res, validation.errors);

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    console.error("[updateEvent] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("[deleteEvent] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
