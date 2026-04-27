import React from "react";

import { api } from "../../services/adminApi";
import AdminCrudScreen, { AdminText } from "./AdminCrudScreen";

export default function ManageWorkoutsScreen() {
  return (
    <AdminCrudScreen
      title="Workouts"
      subtitle="Manage logged workouts."
      service={api.workouts}
      fields={[
        { name: "exerciseName", label: "Exercise name", required: true },
        { name: "muscleGroup", label: "Muscle group", defaultValue: "Chest" },
        { name: "reps", label: "Reps", type: "number", defaultValue: "6", required: true },
        { name: "weight", label: "Weight", type: "number", defaultValue: "0", required: true },
        { name: "duration", label: "Duration", type: "number", defaultValue: "0" },
        { name: "notes", label: "Notes" },
      ]}
      renderItem={(item) => (
        <>
          <AdminText>{item.exerciseName}</AdminText>
          <AdminText muted>{item.muscleGroup} / {item.sets?.length || 0} sets</AdminText>
          {item.notes ? <AdminText muted>{item.notes}</AdminText> : null}
        </>
      )}
    />
  );
}
