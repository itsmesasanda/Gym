import { NavLink } from "react-router-dom";
import Icon from "./Icon";

const NAV = [
  { to: "/", label: "Overview", icon: "overview", end: true },
  { to: "/gyms", label: "Gyms", icon: "gyms" },
  { to: "/members", label: "All Members", icon: "members" },
  { to: "/announcements", label: "Platform Announcements", icon: "announce" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">⬢</div>
        <div>
          <div className="brand-name">Platform Control</div>
          <div className="brand-sub">Super Admin</div>
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

      <div className="sidebar-foot">Phase 2 · Platform-wide</div>
    </aside>
  );
}
