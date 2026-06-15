import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/members", label: "Members", icon: "members" },
  { to: "/checkin", label: "Check-in", icon: "qr" },
  { to: "/trainers", label: "Trainers", icon: "trainer" },
  { to: "/videos", label: "Video Library", icon: "video" },
  { to: "/announcements", label: "Announcements", icon: "announce" },
];

export default function Sidebar() {
  const { gym, admin } = useAuth();
  const isSuper = admin?.role === "super_admin";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">⚡</div>
        <div>
          <div className="brand-name">{gym?.name || "Platform"}</div>
          <div className="brand-sub">{gym?.code ? `Gym · ${gym.code}` : "Super Admin"}</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            <span className="nav-ico"><Icon name={n.icon} /></span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        {isSuper ? "Platform-wide view" : "Phase 2 · Gym Admin"}
      </div>
    </aside>
  );
}
