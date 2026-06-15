import { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/dashboard/stats")
      .then(({ data }) => setStats(data))
      .catch(() => setError("Failed to load dashboard stats"));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!stats) return <div className="loading">Loading dashboard…</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <div className="stat-grid">
        <StatCard label="Total Members" value={stats.members.total} accent />
        <StatCard label="Active" value={stats.members.active} sub="approved & active" />
        <StatCard label="Pending Approval" value={stats.members.pending} sub="awaiting review" />
        <StatCard label="Checked in Today" value={stats.checkinsToday ?? 0} accent sub="QR + manual" />
        <StatCard label="Locked" value={stats.members.locked} sub="access restricted" />
        <StatCard label="Paid" value={stats.payments.paid} sub="up to date" />
        <StatCard label="Overdue" value={stats.payments.overdue} sub="payment due" />
        <StatCard label="AI Plans Generated" value={stats.plansGenerated} accent />
        <StatCard label="Videos" value={stats.content.videos} />
        <StatCard label="Announcements" value={stats.content.announcements} />
      </div>
    </div>
  );
}
