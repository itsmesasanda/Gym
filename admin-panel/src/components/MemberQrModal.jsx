import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import api from "../api/client";
import Modal from "./Modal";

// Shows a member's check-in QR so the admin can download it or share it
// (e.g. via WhatsApp) to members who don't have the app.
export default function MemberQrModal({ memberId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!memberId) { setData(null); return; }
    setError("");
    api
      .get(`/api/admin/members/${memberId}/qr`)
      .then(({ data }) => setData(data))
      .catch(() => setError("Failed to load QR"));
  }, [memberId]);

  const canvas = () => wrapRef.current?.querySelector("canvas");
  const fileName = `${(data?.member.name || "member").replace(/\s+/g, "-")}-checkin-qr.png`;

  const download = () => {
    const c = canvas();
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = fileName;
    a.click();
  };

  const share = () => {
    const c = canvas();
    if (!c) return;
    c.toBlob(async (blob) => {
      const file = new File([blob], fileName, { type: "image/png" });
      const text = `${data.member.name}, here's your gym check-in QR — show it at the entrance to be scanned.`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text }); return; } catch { /* cancelled → fall through */ }
      }
      download(); // desktop / unsupported → just download so they can attach it
    }, "image/png");
  };

  return (
    <Modal
      open={!!memberId}
      title={data ? `${data.member.name} · Check-in QR` : "Check-in QR"}
      onClose={onClose}
      footer={
        data && (
          <>
            <button className="btn btn-outline" onClick={download}>Download</button>
            <button className="btn btn-primary" onClick={share}>Share</button>
          </>
        )
      }
    >
      {error && <div className="alert">{error}</div>}
      {!data && !error && <div className="loading">Loading…</div>}
      {data && (
        <div style={{ textAlign: "center" }} ref={wrapRef}>
          <div className="qr-frame">
            <QRCodeCanvas value={data.payload} size={220} level="M" marginSize={2} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <p className="form-hint" style={{ textAlign: "center" }}>
            The member shows this at the entrance to be scanned. Download or share it (WhatsApp, etc.) if they don't have the app.
          </p>
        </div>
      )}
    </Modal>
  );
}
