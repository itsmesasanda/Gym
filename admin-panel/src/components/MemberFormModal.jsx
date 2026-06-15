import { useState } from "react";
import api from "../api/client";
import Modal from "./Modal";

const EMPTY = {
  // identity
  name: "", email: "", status: "active",
  // contact & personal
  phone: "", gender: "", dateOfBirth: "",
  emergencyContactName: "", emergencyContactPhone: "",
  // fitness profile
  height: "", weight: "", goal: "", activityLevel: "",
  // membership & billing
  membershipPlan: "", paymentStatus: "none", joinDate: "", nextPaymentDate: "",
};

// Add-member form. Record-only: no password is collected — the member claims
// app access later by registering with the same email.
export default function MemberFormModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const close = () => { setForm(EMPTY); setError(""); onClose(); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      // Strip empty strings so the backend applies its own defaults.
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      const { data } = await api.post("/api/admin/members", payload);
      setForm(EMPTY);
      onCreated?.(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Add Member"
      onClose={close}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" form="member-form" disabled={busy}>
            {busy ? "Adding…" : "Add Member"}
          </button>
        </>
      }
    >
      <form id="member-form" className="form" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}

        {/* Identity */}
        <div className="form-section">
          <p className="form-section-title">Identity</p>
          <div className="field-row">
            <label className="field"><span>Full name *</span>
              <input value={form.name} onChange={set("name")} required autoFocus />
            </label>
            <label className="field"><span>Status</span>
              <select value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="locked">Locked</option>
              </select>
            </label>
          </div>
          <label className="field"><span>Email *</span>
            <input type="email" value={form.email} onChange={set("email")} required />
          </label>
          <p className="form-hint">No password is set. The member can claim app access later by registering with this same email.</p>
        </div>

        {/* Contact & personal */}
        <div className="form-section">
          <p className="form-section-title">Contact &amp; personal</p>
          <div className="field-row">
            <label className="field"><span>Phone</span>
              <input value={form.phone} onChange={set("phone")} />
            </label>
            <label className="field"><span>Gender</span>
              <select value={form.gender} onChange={set("gender")}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <label className="field"><span>Date of birth</span>
            <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
          </label>
          <div className="field-row">
            <label className="field"><span>Emergency contact</span>
              <input value={form.emergencyContactName} onChange={set("emergencyContactName")} placeholder="Name" />
            </label>
            <label className="field"><span>Emergency phone</span>
              <input value={form.emergencyContactPhone} onChange={set("emergencyContactPhone")} />
            </label>
          </div>
        </div>

        {/* Fitness profile */}
        <div className="form-section">
          <p className="form-section-title">Fitness profile</p>
          <div className="field-row">
            <label className="field"><span>Height (cm)</span>
              <input type="number" value={form.height} onChange={set("height")} />
            </label>
            <label className="field"><span>Weight (kg)</span>
              <input type="number" value={form.weight} onChange={set("weight")} />
            </label>
          </div>
          <div className="field-row">
            <label className="field"><span>Goal</span>
              <select value={form.goal} onChange={set("goal")}>
                <option value="">—</option>
                <option value="muscle_gain">Muscle gain</option>
                <option value="fat_loss">Fat loss</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
            <label className="field"><span>Activity level</span>
              <select value={form.activityLevel} onChange={set("activityLevel")}>
                <option value="">—</option>
                <option value="low">Low (1–2×/week)</option>
                <option value="moderate">Moderate (3–4×/week)</option>
                <option value="high">High (5+/week)</option>
              </select>
            </label>
          </div>
        </div>

        {/* Membership & billing */}
        <div className="form-section">
          <p className="form-section-title">Membership &amp; billing</p>
          <div className="field-row">
            <label className="field"><span>Plan</span>
              <input value={form.membershipPlan} onChange={set("membershipPlan")} placeholder="e.g. Monthly" />
            </label>
            <label className="field"><span>Payment status</span>
              <select value={form.paymentStatus} onChange={set("paymentStatus")}>
                <option value="none">None</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
          </div>
          <div className="field-row">
            <label className="field"><span>Join date</span>
              <input type="date" value={form.joinDate} onChange={set("joinDate")} />
            </label>
            <label className="field"><span>Next payment</span>
              <input type="date" value={form.nextPaymentDate} onChange={set("nextPaymentDate")} />
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
