import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import Icon from "../components/Icon";

const EMPTY = { title: "", body: "", priority: "normal", pinned: false, date: "" };

// Platform-wide announcements (gymId = null) — visible to members of every gym.
export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get("/api/super/announcements").then(({ data }) => setItems(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setError(""); setOpen(true); };
  const openEdit = (a) => {
    setForm({ title: a.title, body: a.body || "", priority: a.priority, pinned: a.pinned, date: a.date || "" });
    setEditId(a._id);
    setError("");
    setOpen(true);
  };

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editId) await api.put(`/api/super/announcements/${editId}`, form);
      else await api.post("/api/super/announcements", form);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this platform announcement?")) return;
    await api.delete(`/api/super/announcements/${id}`);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Platform Announcements</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} /> New Announcement
        </button>
      </div>

      <p className="muted" style={{ marginTop: -10, marginBottom: 18 }}>
        These are shown to members across <b>every</b> gym on the platform.
      </p>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Pinned</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="muted center">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="muted center">No platform announcements yet</td></tr>
            ) : (
              items.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div className="cell-name">{a.title}</div>
                    {a.body && <div className="cell-sub">{a.body}</div>}
                  </td>
                  <td><Badge value={a.priority} /></td>
                  <td className="muted">{a.pinned ? "📌 Pinned" : "—"}</td>
                  <td className="muted">{a.date}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(a)}>Edit</button>
                      <button className="btn btn-sm btn-outline danger" onClick={() => remove(a._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editId ? "Edit Announcement" : "New Platform Announcement"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="ann-form" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="ann-form" className="form" onSubmit={save}>
          {error && <div className="alert">{error}</div>}
          <label className="field"><span>Title</span>
            <input value={form.title} onChange={set("title")} required autoFocus />
          </label>
          <label className="field"><span>Body</span>
            <textarea value={form.body} onChange={set("body")} placeholder="Message to all members…" />
          </label>
          <div className="field-row">
            <label className="field"><span>Priority</span>
              <select value={form.priority} onChange={set("priority")}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="field"><span>Date</span>
              <input type="date" value={form.date} onChange={set("date")} />
            </label>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.pinned} onChange={set("pinned")} />
            Pin to top of every member's feed
          </label>
        </form>
      </Modal>
    </div>
  );
}
