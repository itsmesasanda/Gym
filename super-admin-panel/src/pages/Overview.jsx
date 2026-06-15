import { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/super/analytics")
      .then(({ data }) => setStats(data))
      .catch(() => setError("Failed to load platform analytics"));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!stats) return <div className="loading">Loading platform overview…</div>;

  return (
    <div>
      <h1 className="page-title">Platform Overview</h1>
      <div className="stat-grid">
        <StatCard label="Total Gyms" value={stats.gyms.total} accent />
        <StatCard label="Active Gyms" value={stats.gyms.active} sub={`${stats.gyms.disabled} disabled`} />
        <StatCard label="Total Members" value={stats.members.total} accent />
        <StatCard label="Active Members" value={stats.members.active} />
        <StatCard label="Pending Members" value={stats.members.pending} sub="awaiting gym approval" />
        <StatCard label="Gym Admins" value={stats.gymAdmins} />
        <StatCard label="AI Plans Generated" value={stats.plansGenerated} accent />
        <StatCard label="Videos" value={stats.content.videos} />
        <StatCard label="Announcements" value={stats.content.announcements} />
      </div>
    </div>
  );
}
