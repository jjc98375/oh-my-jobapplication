import { useState, useEffect } from "react";
import { authStorage, statusStorage } from "@/lib/storage";
import type { AuthState, ApplyStatus } from "@/lib/types";
import "./style.css";

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [status, setStatus] = useState<ApplyStatus | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([authStorage.getValue(), statusStorage.getValue()]).then(([a, s]) => {
      setAuth(a);
      setStatus(s);
      setLoading(false);
    });
    const unwatch = statusStorage.watch((newStatus) => {
      if (newStatus) setStatus(newStatus);
    });
    return () => unwatch();
  }, []);

  if (loading) return <div className="container">Loading...</div>;

  if (!auth) {
    return (
      <div className="container auth-prompt">
        <h1>oh-my-jobapplication</h1>
        <p style={{ margin: "12px 0", color: "#6b7280" }}>Sign in on the web app first, then click below to connect.</p>
        <button className="btn btn-primary" style={{ width: "100%" }}
          onClick={() => browser.tabs.create({ url: `${import.meta.env.VITE_WEB_APP_URL || "http://localhost:3000"}/api/extension/token` })}>
          Connect Account
        </button>
      </div>
    );
  }

  if (!status) return null;

  const canStart = status.state === "idle" && url.trim() !== "";
  const isRunning = status.state === "running";
  const isPaused = status.state === "paused";

  return (
    <div className="container">
      <div className="header">
        <h1>oh-my-jobapplication</h1>
        <span className={`status-badge status-${status.state}`}>{status.state}</span>
      </div>
      <div className="stats">
        <div className="stat"><div className="stat-value">{status.dailyCount}/{status.dailyLimit}</div><div className="stat-label">Today</div></div>
        <div className="stat"><div className="stat-value">{status.completed}</div><div className="stat-label">Applied</div></div>
        <div className="stat"><div className="stat-value">{status.queue.length}</div><div className="stat-label">Queued</div></div>
      </div>
      <input className="url-input" placeholder="Paste LinkedIn jobs tracker URL..." value={url}
        onChange={(e) => setUrl(e.target.value)} disabled={isRunning || isPaused} />
      <div className="controls">
        {status.state === "idle" && (
          <button className="btn btn-primary" disabled={!canStart}
            onClick={() => browser.runtime.sendMessage({ type: "START", url: url.trim() })}>Start Applying</button>
        )}
        {isRunning && (
          <>
            <button className="btn btn-secondary" onClick={() => browser.runtime.sendMessage({ type: "PAUSE" })}>Pause</button>
            <button className="btn btn-secondary" onClick={() => browser.runtime.sendMessage({ type: "SKIP" })}>Skip</button>
            <button className="btn btn-danger" onClick={() => browser.runtime.sendMessage({ type: "STOP" })}>Stop</button>
          </>
        )}
        {isPaused && (
          <>
            <button className="btn btn-primary" onClick={() => browser.runtime.sendMessage({ type: "RESUME" })}>Resume</button>
            <button className="btn btn-danger" onClick={() => browser.runtime.sendMessage({ type: "STOP" })}>Stop</button>
          </>
        )}
      </div>
      {status.currentJob && (
        <div style={{ padding: "8px", background: "#eff6ff", borderRadius: "6px", marginBottom: "12px", fontSize: "13px" }}>
          Applying to: <strong>{status.currentJob.title}</strong> at {status.currentJob.company}
        </div>
      )}
      <div className="logs">
        {status.logs.length === 0 && <div className="log-entry" style={{ color: "#9ca3af" }}>No activity yet.</div>}
        {status.logs.slice(-20).reverse().map((log, i) => (
          <div key={i} className={`log-entry log-${log.type}`}>
            <span style={{ color: "#9ca3af", marginRight: "6px" }}>{log.time}</span>{log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
