import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/Modal";
import Icon from "../components/Icon";

const EMPTY = { name: "", email: "", memberIds: [] };

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]); // this gym's members, for the picker
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(null); // { trainer, members }

  const loadTrainers = () => api.get("/api/admin/trainers").then(({ data }) => setTrainers(data));
  const loadMembers = () => api.get("/api/admin/members").then(({ data }) => setMembers(data));

  useEffect(() => {
    Promise.all([loadTrainers(), loadMembers()]).finally(() => setLoading(false));
  }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setError(""); setOpen(true); };

  const openEdit = async (t) => {
    setError("");
    const { data } = await api.get(`/api/admin/trainers/${t._id}/members`);
    setForm({ name: t.name, email: t.email, memberIds: data.members.map((m) => m._id) });
    setEditId(t._id);
    setOpen(true);
  };

  const toggleMember = (id) =>
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id],
    }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editId) await api.put(`/api/admin/trainers/${editId}`, form);
      else await api.post("/api/admin/trainers", form);
      setOpen(false);
      await Promise.all([loadTrainers(), loadMembers()]);
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this trainer? Their members will be unassigned.")) return;
    await api.delete(`/api/admin/trainers/${id}`);
    loadTrainers();
  };

  const viewMembers = async (t) => {
    const { data } = await api.get(`/api/admin/trainers/${t._id}/members`);
    setViewing(data);
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Trainers</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} /> Add Trainer
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : trainers.length === 0 ? (
        <div className="muted">No trainers yet. Add your first one.</div>
      ) : (
        <div className="grid-cards">
          {trainers.map((t) => (
            <div className="gym-card" key={t._id}>
              <div className="gym-card-head">
                <div>
                  <div className="gym-name">{t.name}</div>
                  <div className="gym-meta">{t.email}</div>
                </div>
                <div className="avatar sm">{(t.name || "?").slice(0, 1).toUpperCase()}</div>
              </div>
              <div className="gym-stats">
                <div className="gym-stat"><div className="n">{t.memberCount}</div><div className="l">Members</div></div>
              </div>
              <div className="gym-card-actions">
                <button className="btn btn-sm btn-outline" onClick={() => viewMembers(t)}>View members</button>
                <button className="btn btn-sm btn-outline" onClick={() => openEdit(t)}>Edit</button>
                <button className="btn btn-sm btn-outline danger" onClick={() => remove(t._id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit trainer */}
      <Modal
        open={open}
        title={editId ? "Edit Trainer" : "Add Trainer"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="trainer-form" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="trainer-form" className="form" onSubmit={save}>
          {error && <div className="alert">{error}</div>}
          <label className="field"><span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </label>
          <label className="field"><span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <div className="field">
            <span>Assigned members ({form.memberIds.length})</span>
            <div className="member-picker">
              {members.length === 0 ? (
                <div className="muted" style={{ padding: 12 }}>No members in this gym yet.</div>
              ) : (
                members.map((m) => (
                  <label key={m._id} className="picker-row">
                    <input
                      type="checkbox"
                      checked={form.memberIds.includes(m._id)}
                      onChange={() => toggleMember(m._id)}
                    />
                    <span>{m.name || "—"}<span className="picker-sub"> · {m.email}</span></span>
                  </label>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* View a trainer's members */}
      <Modal
        open={!!viewing}
        title={viewing ? `${viewing.trainer.name} · members` : ""}
        onClose={() => setViewing(null)}
        footer={<button className="btn btn-primary" onClick={() => setViewing(null)}>Close</button>}
      >
        {viewing &&
          (viewing.members.length === 0 ? (
            <div className="muted">No members assigned to this trainer.</div>
          ) : (
            <div className="member-list">
              {viewing.members.map((m) => (
                <div key={m._id} className="cell-member" style={{ padding: "8px 0" }}>
                  <div className="avatar sm">{(m.name || "?").slice(0, 1).toUpperCase()}</div>
                  <div>
                    <div className="cell-name">{m.name || "—"}</div>
                    <div className="cell-sub">{m.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </Modal>
    </div>
  );
}
