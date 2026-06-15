import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import Badge from "../components/Badge";

const STATUSES = ["all", "pending", "active", "locked", "rejected"];

export default function Members() {
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/super/members", { params: { status, search } });
      setMembers(data);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  // Status actions reuse the shared admin endpoints — allowed for super_admin.
  const act = async (id, action) => {
    setBusyId(id);
    try {
      await api.patch(`/api/admin/members/${id}/${action}`);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (m) => {
    const disabled = busyId === m._id;
    if (m.status === "pending")
      return (
        <>
          <button className="btn btn-sm btn-primary" disabled={disabled} onClick={() => act(m._id, "approve")}>Approve</button>
          <button className="btn btn-sm btn-outline" disabled={disabled} onClick={() => act(m._id, "reject")}>Reject</button>
        </>
      );
    if (m.status === "active")
      return <button className="btn btn-sm btn-outline danger" disabled={disabled} onClick={() => act(m._id, "lock")}>Lock</button>;
    if (m.status === "locked")
      return <button className="btn btn-sm btn-outline" disabled={disabled} onClick={() => act(m._id, "unlock")}>Unlock</button>;
    if (m.status === "rejected")
      return <button className="btn btn-sm btn-outline" disabled={disabled} onClick={() => act(m._id, "approve")}>Approve</button>;
    return null;
  };

  return (
    <div>
      <h1 className="page-title">All Members</h1>

      <div className="toolbar">
        <div className="pill-group">
          {STATUSES.map((s) => (
            <button key={s} className={"pill" + (status === s ? " active" : "")} onClick={() => setStatus(s)}>
              {s}
            </button>
          ))}
        </div>
        <input className="search" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Gym</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="muted center">Loading…</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={5} className="muted center">No members found</td></tr>
            ) : (
              members.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="cell-member">
                      <div className="avatar sm">{(m.name || "?").slice(0, 1).toUpperCase()}</div>
                      <div>
                        <div className="cell-name">{m.name || "—"}</div>
                        <div className="cell-sub">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {m.gymId ? <span className="code-pill">{m.gymId.code}</span> : <span className="muted">—</span>}
                    {m.gymId?.name && <div className="cell-sub">{m.gymId.name}</div>}
                  </td>
                  <td><Badge value={m.status} /></td>
                  <td><Badge value={m.paymentStatus || "none"} /></td>
                  <td><div className="row-actions">{actionsFor(m)}</div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
