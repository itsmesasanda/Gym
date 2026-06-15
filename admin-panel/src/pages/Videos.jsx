import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/Modal";
import Icon from "../components/Icon";

const EMPTY = { title: "", description: "", category: "", youtubeUrl: "", thumbnail: "" };

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get("/api/admin/videos").then(({ data }) => setVideos(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setError(""); setOpen(true); };
  const openEdit = (v) => {
    setForm({ title: v.title, description: v.description, category: v.category, youtubeUrl: v.youtubeUrl, thumbnail: v.thumbnail || "" });
    setEditId(v._id);
    setError("");
    setOpen(true);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editId) await api.put(`/api/admin/videos/${editId}`, form);
      else await api.post("/api/admin/videos", form);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    await api.delete(`/api/admin/videos/${id}`);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Video Library</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} /> Add Video
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : videos.length === 0 ? (
        <div className="muted">No videos yet. Add your first one.</div>
      ) : (
        <div className="grid-cards">
          {videos.map((v) => (
            <div className="vcard" key={v._id}>
              <div className="vthumb" style={{ backgroundImage: v.thumbnail ? `url(${v.thumbnail})` : "none" }} />
              <div className="vbody">
                <div className="vcat">{v.category}</div>
                <div className="vtitle">{v.title}</div>
                <div className="vdesc">{v.description}</div>
                <div className="vactions">
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(v)}>Edit</button>
                  <button className="btn btn-sm btn-outline danger" onClick={() => remove(v._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editId ? "Edit Video" : "Add Video"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="video-form" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <form id="video-form" className="form" onSubmit={save}>
          {error && <div className="alert">{error}</div>}
          <label className="field"><span>Title</span>
            <input value={form.title} onChange={set("title")} required />
          </label>
          <label className="field"><span>Category</span>
            <input value={form.category} onChange={set("category")} placeholder="Chest, Back, Legs…" />
          </label>
          <label className="field"><span>YouTube URL</span>
            <input value={form.youtubeUrl} onChange={set("youtubeUrl")} placeholder="https://www.youtube.com/watch?v=…" required />
          </label>
          <label className="field"><span>Thumbnail URL (optional)</span>
            <input value={form.thumbnail} onChange={set("thumbnail")} placeholder="Auto-derived from YouTube if blank" />
          </label>
          <label className="field"><span>Description</span>
            <textarea value={form.description} onChange={set("description")} required />
          </label>
        </form>
      </Modal>
    </div>
  );
}
