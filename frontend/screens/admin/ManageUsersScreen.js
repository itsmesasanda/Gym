import React from "react";

import { api } from "../../services/adminApi";
import AdminCrudScreen, { AdminText } from "./AdminCrudScreen";

export default function ManageUsersScreen() {
  return (
    <AdminCrudScreen
      title="Users"
      subtitle="Create and remove gym members."
      service={api.users}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", required: true },
        { name: "phone", label: "Phone" },
        { name: "plan", label: "Plan", defaultValue: "Basic" },
      ]}
      renderItem={(item) => (
        <>
          <AdminText>{item.name}</AdminText>
          <AdminText muted>{item.email}</AdminText>
          <AdminText muted>{item.plan || "Basic"} plan</AdminText>
        </>
      )}
    />
  );
}
