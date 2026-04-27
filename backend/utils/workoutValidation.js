export const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Arms", "Shoulders", "Biceps", "Triceps", "Core"];

const muscleGroupLookup = new Map(MUSCLE_GROUPS.map((group) => [group.toLowerCase(), group]));

export const normalizeMuscleGroup = (value) => {
  const normalized = muscleGroupLookup.get((value || "").trim().toLowerCase());
  return normalized || null;
};

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const buildWorkoutPayload = (body) => {
  const duration = toNumber(body.duration);

  return {
    exerciseName: (body.exerciseName || "").trim(),
    muscleGroup: normalizeMuscleGroup(body.muscleGroup),
    sets: Array.isArray(body.sets)
      ? body.sets.map((set) => ({
          reps: toNumber(set?.reps),
          weight: toNumber(set?.weight),
        }))
      : [],
    duration: duration ?? 0,
    notes: (body.notes || "").trim(),
    ...(body.date !== undefined ? { date: body.date } : {}),
    ...(body.time !== undefined ? { time: body.time } : {}),
  };
};

export const validateWorkoutPayload = (payload) => {
  if (payload.exerciseName.length < 2 || payload.exerciseName.length > 50) {
    return "Exercise name must be 2-50 characters";
  }

  if (!payload.muscleGroup) {
    return `Muscle group must be one of ${MUSCLE_GROUPS.join(", ")}`;
  }

  if (!Array.isArray(payload.sets) || payload.sets.length < 1) {
    return "At least one set is required";
  }

  if (payload.sets.length > 4) {
    return "Maximum 4 sets allowed";
  }

  for (const [index, set] of payload.sets.entries()) {
    if (set.reps === null || set.weight === null) {
      return `Set ${index + 1} must include reps and weight`;
    }

    if (set.reps < 6 || set.reps > 15) {
      return `Set ${index + 1} reps must be between 6 and 15`;
    }

    if (set.weight < 0) {
      return `Set ${index + 1} weight cannot be negative`;
    }
  }

  if (payload.duration === null || payload.duration < 0) {
    return "Duration must be a non-negative number";
  }

  if (payload.duration > 0 && payload.duration < 5) {
    return "Duration must be 0 or at least 5 minutes";
  }

  if (payload.notes.length > 500) {
    return "Notes cannot exceed 500 characters";
  }

  return null;
};

