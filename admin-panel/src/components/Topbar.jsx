import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

const initialsOf = (name = "Admin") =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Topbar() {
  const { admin, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-title">
        Welcome back, <b>{admin?.name?.split(" ")[0] || "Admin"}</b>
      </div>
      <div className="topbar-right">
        <span className="role-pill">
          {admin?.role === "super_admin" ? "Super Admin" : "Gym Admin"}
        </span>
        <div className="avatar">{initialsOf(admin?.name)}</div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          <Icon name="logout" size={16} /> Sign out
        </button>
      </div>
    </header>
  );
}
