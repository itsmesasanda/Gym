import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../api/client";

export default function Checkin() {
  const [result, setResult] = useState(null); // { status, member, message }
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState("");
  const [attendance, setAttendance] = useState({ records: [], count: 0, date: "" });
  const [manualQ, setManualQ] = useState("");
  const [members, setMembers] = useState([]);

  const scannerRef = useRef(null);
  const lastScan = useRef({ token: "", at: 0 });

  const loadAttendance = useCallback(() => {
    api.get("/api/admin/attendance").then(({ data }) => setAttendance(data)).catch(() => {});
  }, []);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const submitToken = useCallback(async (token) => {
    try {
      const { data } = await api.post("/api/admin/checkin", { token });
      setResult(data);
      loadAttendance();
    } catch (err) {
      setResult({ status: "error", message: err.response?.data?.message || "Check-in failed" });
    }
  }, [loadAttendance]);

  const onScan = useCallback((decoded) => {
    const now = Date.now();
    // Ignore the same code re-read within 3s (the camera fires continuously).
    if (decoded === lastScan.current.token && now - lastScan.current.at < 3000) return;
    lastScan.current = { token: decoded, at: now };
    submitToken(decoded);
  }, [submitToken]);

  const startScan = async () => {
    setCamError("");
    setResult(null);
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, onScan, () => {});
      setScanning(true);
    } catch (err) {
      setCamError("Camera unavailable — use manual check-in below. (" + (err?.message || "no camera") + ")");
      scannerRef.current = null;
    }
  };

  const stopScan = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try { await s.stop(); } catch { /* already stopped */ }
      try { s.clear(); } catch { /* noop */ }
    }
    setScanning(false);
  }, []);

  useEffect(() => () => { stopScan(); }, [stopScan]); // cleanup on unmount

  // Manual member search
  useEffect(() => {
    if (!manualQ.trim()) { setMembers([]); return; }
    const t = setTimeout(() => {
      api.get("/api/admin/members", { params: { search: manualQ } })
        .then(({ data }) => setMembers(data.slice(0, 8)))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [manualQ]);

  const manualCheckIn = async (userId) => {
    try {
      const { data } = await api.post("/api/admin/checkin/manual", { userId });
      setResult(data);
      setManualQ("");
      setMembers([]);
      loadAttendance();
    } catch (err) {
      setResult({ status: "error", message: err.response?.data?.message || "Check-in failed" });
    }
  };

  const resultClass = result
    ? result.status === "checked_in" ? "ok" : result.status === "already" ? "warn" : "err"
    : "";
  const resultText = result
    ? result.status === "checked_in" ? "✓ Checked in"
      : result.status === "already" ? "Already checked in today"
      : (result.message || "Check-in failed")
    : "";

  return (
    <div>
      <h1 className="page-title">Check-in</h1>

      <div className="checkin-grid">
        {/* Scanner + manual */}
        <div className="card" style={{ padding: 20 }}>
          <div className="page-head" style={{ marginBottom: 14 }}>
            <strong>Scan member QR</strong>
            {scanning
              ? <button className="btn btn-sm btn-outline danger" onClick={stopScan}>Stop</button>
              : <button className="btn btn-sm btn-primary" onClick={startScan}>Start scanner</button>}
          </div>

          <div id="qr-reader" />
          {!scanning && !camError && <p className="form-hint" style={{ textAlign: "center" }}>Tap “Start scanner” and point the camera at the member's QR.</p>}
          {camError && <div className="alert" style={{ marginTop: 12 }}>{camError}</div>}

          {result && (
            <div className={"scan-result " + resultClass}>
              {resultText}
              {result.member && <span className="who">{result.member.name} · {result.member.email}</span>}
            </div>
          )}

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            <strong style={{ fontSize: 14 }}>Manual check-in</strong>
            <input
              className="search"
              style={{ width: "100%", marginTop: 10 }}
              placeholder="Search member name or email…"
              value={manualQ}
              onChange={(e) => setManualQ(e.target.value)}
            />
            {members.length > 0 && (
              <div className="manual-results">
                {members.map((m) => (
                  <div className="manual-row" key={m._id}>
                    <div>
                      <div className="cell-name">{m.name || "—"}</div>
                      <div className="cell-sub">{m.email}</div>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => manualCheckIn(m._id)}>Check in</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's check-ins */}
        <div className="card" style={{ padding: 20 }}>
          <div className="page-head" style={{ marginBottom: 14 }}>
            <strong>Today's check-ins</strong>
            <span className="role-pill">{attendance.count}</span>
          </div>
          {attendance.records.length === 0 ? (
            <div className="muted">No check-ins yet today.</div>
          ) : (
            <div className="member-list">
              {attendance.records.map((r) => (
                <div key={r._id} className="manual-row">
                  <div className="cell-member">
                    <div className="avatar sm">{(r.member?.name || "?").slice(0, 1).toUpperCase()}</div>
                    <div>
                      <div className="cell-name">{r.member?.name || "—"}</div>
                      <div className="cell-sub">{r.member?.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="cell-sub">{new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    {r.method === "manual" && <span className="badge badge-grey" style={{ marginTop: 4 }}>manual</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
