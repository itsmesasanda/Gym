import React from "react";

import { api } from "../../services/adminApi";
import AdminCrudScreen, { AdminText } from "./AdminCrudScreen";

export default function ManageMealsScreen() {
  return (
    <AdminCrudScreen
      title="Meals"
      subtitle="Manage meal items used by the admin area."
      service={api.meals}
      fields={[
        { name: "name", label: "Meal name", required: true },
        { name: "calories", label: "Calories", type: "number" },
        { name: "date", label: "Date" },
      ]}
      renderItem={(item) => (
        <>
          <AdminText>{item.name}</AdminText>
          <AdminText muted>{item.calories || 0} calories</AdminText>
          {item.date ? <AdminText muted>{item.date}</AdminText> : null}
        </>
      )}
    />
  );
}
