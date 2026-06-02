import Meal from "../models/Meal.js";

const pickFields = ({ name, calories, date }) => ({
  ...(name     !== undefined && { name }),
  ...(calories !== undefined && { calories }),
  ...(date     !== undefined && { date }),
});

export const getAllMeals = async (req, res) => {
  try {
    const meals = await Meal.find().sort({ createdAt: -1 });
    res.json(meals);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createMeal = async (req, res) => {
  try {
    const meal = new Meal(pickFields(req.body));
    await meal.save();
    res.status(201).json(meal);
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid meal data" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      pickFields(req.body),
      { new: true, runValidators: true }
    );
    if (!meal) return res.status(404).json({ error: "Meal not found" });
    res.json(meal);
  } catch (err) {
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ error: "Invalid meal data" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMeal = async (req, res) => {
  try {
    await Meal.findByIdAndDelete(req.params.id);
    res.json({ message: "Meal deleted" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};
