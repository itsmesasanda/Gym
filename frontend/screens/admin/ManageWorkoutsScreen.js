import React from "react";

import { api } from "../../services/adminApi";
import AdminCrudScreen, { AdminText } from "./AdminCrudScreen";

export default function ManageWorkoutsScreen() {
  return (
    <AdminCrudScreen
      title="Workouts"
      subtitle="Manage workout events."
      service={api.workouts}
      fields={[
        { name: "title", label: "Workout title", required: true },
        { name: "date", label: "Date" },
        { name: "time", label: "Time" },
        { name: "location", label: "Location" },
        { name: "description", label: "Description" },
      ]}
      renderItem={(item) => (
        <>
          <AdminText>{item.title}</AdminText>
          <AdminText muted>{[item.date, item.time, item.location].filter(Boolean).join(" / ") || "No schedule"}</AdminText>
          {item.description ? <AdminText muted>{item.description}</AdminText> : null}
        </>
      )}
    />
  );
}
