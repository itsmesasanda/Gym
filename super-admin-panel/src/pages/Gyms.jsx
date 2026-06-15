import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import Icon from "../components/Icon";

const EMPTY = {
  name: "", code: "", address: "", contactEmail: "", contactPhone: "", primaryColor: "#C8FF00",
  adminName: "", adminEmail: "", adminPassword: "",
};

export default function Gyms() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState(null); // one-time gym-admin credentials

  const load = () =>
    api.get("/api/super/gyms").then(({ data }) => setGyms(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setForm(EMPTY); setEditId(null); setError(""); setOpen(true); };
  const openEdit = (g) => {
    setForm({
      name: g.name, code: g.code, address: g.address || "", contactEmail: g.contactEmail || "",
      contactPhone: g.contactPhone || "", primaryColor: g.branding?.primaryColor || "#C8FF00",
      adminName: "", adminEmail: "", adminPassword: "",
    });
    setEditId(g._id);
    setError("");
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editId) {
        await api.put(`/api/super/gyms/${editId}`, form);
        setOpen(false);
      } else {
        const { data } = await api.post("/api/super/gyms", form);
        setOpen(false);
        setCreds({ code: data.gym.code, gym: data.gym.name, email: data.adminCreds?.email });
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (g) => {
    const status = g.status === "active" ? "disabled" : "active";
    await api.patch(`/api/super/gyms/${g._id}/status`, { status });
    load();
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Gyms</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} /> Create Gym
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : gyms.length === 0 ? (
        <div className="muted">No gyms yet. Create your first one.</div>
      ) : (
        <div className="grid-cards">
          {gyms.map((g) => (
            <div className={"gym-card" + (g.status === "disabled" ? " disabled" : "")} key={g._id}>
              <div className="gym-card-head">
                <div>
                  <div className="gym-name">{g.name}</div>
                  <div className="gym-meta">
                    <span className="swatch" style={{ background: g.branding?.primaryColor }} />
                    {g.contactEmail || "no contact"}
                  </div>
                </div>
                <Badge value={g.status} />
              </div>

              <div style={{ marginTop: 12 }}>
                <span className="code-pill">{g.code}</span>
              </div>

              <div className="gym-stats">
                <div className="gym-stat"><div className="n">{g.memberCount}</div><div className="l">Members</div></div>
                <div className="gym-stat"><div className="n">{g.adminCount}</div><div className="l">Admins</div></div>
              </div>

              <div className="gym-card-actions">
                <button className="btn btn-sm btn-outline" onClick={() => openEdit(g)}>Edit</button>
                <button
                  className={"btn btn-sm btn-outline" + (g.status === "active" ? " danger" : "")}
                  onClick={() => toggleStatus(g)}
                >
                  {g.status === "active" ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit form */}
      <Modal
        open={open}
        title={editId ? "Edit Gym" : "Create Gym"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="gym-form" disabled={busy}>
              {busy ? "Saving…" : editId ? "Save" : "Create Gym"}
            </button>
          </>
        }
      >
        <form id="gym-form" className="form" onSubmit={save}>
          {error && <div className="alert">{error}</div>}

          <div className="form-section">
            <p className="form-section-title">Gym info</p>
            <div className="field-row">
              <label className="field"><span>Gym name *</span>
                <input value={form.name} onChange={set("name")} required autoFocus />
              </label>
              <label className="field"><span>Gym code</span>
                <input
                  value={form.code}
                  onChange={set("code")}
                  disabled={!!editId}
                  placeholder="Auto-generated if blank"
                  style={{ textTransform: "uppercase" }}
                />
              </label>
            </div>
            {!editId && <p className="form-hint">Members enter this code on first login. Leave blank to auto-generate (4–12 letters/numbers).</p>}
            <label className="field"><span>Address</span>
              <input value={form.address} onChange={set("address")} />
            </label>
            <div className="field-row">
              <label className="field"><span>Contact email</span>
                <input type="email" value={form.contactEmail} onChange={set("contactEmail")} />
              </label>
              <label className="field"><span>Contact phone</span>
                <input value={form.contactPhone} onChange={set("contactPhone")} />
              </label>
            </div>
            <label className="field"><span>Brand color</span>
              <input type="color" value={form.primaryColor} onChange={set("primaryColor")} style={{ height: 42, padding: 4 }} />
            </label>
          </div>

          {!editId && (
            <div className="form-section">
              <p className="form-section-title">Gym admin (onboarding)</p>
              <div className="field-row">
                <label className="field"><span>Admin name</span>
                  <input value={form.adminName} onChange={set("adminName")} />
                </label>
                <label className="field"><span>Admin email</span>
                  <input type="email" value={form.adminEmail} onChange={set("adminEmail")} />
                </label>
              </div>
              <label className="field"><span>Admin password</span>
                <input type="password" value={form.adminPassword} onChange={set("adminPassword")} placeholder="Min 8 characters" />
              </label>
              <p className="form-hint">Set an email + password to create this gym's admin login. Leave both blank to add the admin later.</p>
            </div>
          )}
        </form>
      </Modal>

      {/* One-time credentials reveal */}
      <Modal
        open={!!creds}
        title="Gym created"
        onClose={() => setCreds(null)}
        footer={<button className="btn btn-primary" onClick={() => setCreds(null)}>Done</button>}
      >
        {creds && (
          <div className="creds-box">
            <h4>{creds.gym} created</h4>
            <div className="creds-row"><span>Gym code</span><b>{creds.code}</b></div>
            {creds.email && <div className="creds-row"><span>Admin email</span><b>{creds.email}</b></div>}
            {creds.email
              ? <p className="creds-warn">The gym admin signs in at the gym admin panel with this email and the password you set.</p>
              : <p className="creds-warn">No admin yet — open this gym later to add one. Share the gym code with members.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
