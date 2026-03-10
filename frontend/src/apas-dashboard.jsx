import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Menu, LogOut, Github, Globe, FolderOpen, Activity, Shield,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Zap, BookOpen, BarChart2, ArrowUpRight, ArrowDownRight, Code2, GitBranch
} from "lucide-react";

const files = ["index.js", "App.jsx", "auth.js", "server.py", "database.sql", "analyzer.py"];

const fileMetricsData = [
  [{ metric: "Quality", value: 91 }, { metric: "Structure", value: 88 }, { metric: "Tests", value: 72 }, { metric: "Security", value: 84 }],
  [{ metric: "Quality", value: 78 }, { metric: "Structure", value: 85 }, { metric: "Tests", value: 60 }, { metric: "Security", value: 70 }],
  [{ metric: "Quality", value: 65 }, { metric: "Structure", value: 70 }, { metric: "Tests", value: 55 }, { metric: "Security", value: 90 }],
  [{ metric: "Quality", value: 82 }, { metric: "Structure", value: 75 }, { metric: "Tests", value: 88 }, { metric: "Security", value: 77 }],
  [{ metric: "Quality", value: 95 }, { metric: "Structure", value: 92 }, { metric: "Tests", value: 40 }, { metric: "Security", value: 68 }],
  [{ metric: "Quality", value: 74 }, { metric: "Structure", value: 69 }, { metric: "Tests", value: 80 }, { metric: "Security", value: 73 }],
];

const fileColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
const fileTrends = ["Improving", "Declining", "Needs Focus", "Improving", "Improving", "Declining"];

const readinessScore = 78;
const readinessData = [
  { name: "Completed", value: readinessScore },
  { name: "Remaining", value: 100 - readinessScore },
];

const statCards = [
  { label: "Overall Score", value: "78/100", sub: "Last analysis", delta: "+2.3%", up: true, icon: Activity, color: "#3b82f6" },
  { label: "Files Analyzed", value: "6", sub: "This session", delta: "+1", up: true, icon: Code2, color: "#10b981" },
  { label: "Code Health", value: "7.6/10", sub: "Avg metric score", delta: "Stable", up: null, icon: Shield, color: "#f59e0b" },
  { label: "Issues Found", value: "3", sub: "Need attention", delta: "Priority", up: false, icon: AlertTriangle, color: "#ef4444" },
];

const issues = [
  { file: "auth.js", issue: "Low test coverage (55%)", type: "Tests", priority: "High", color: "#ef4444", bg: "#fee2e2" },
  { file: "database.sql", issue: "Security score below threshold", type: "Security", priority: "High", color: "#ef4444", bg: "#fee2e2" },
  { file: "App.jsx", issue: "Declining quality trend", type: "Quality", priority: "Medium", color: "#ca8a04", bg: "#fef9c3" },
];

function getScoreAvg(metrics) {
  return Math.round(metrics.reduce((a, b) => a + b.value, 0) / metrics.length);
}

function getReadinessLabel(score) {
  if (score >= 85) return "Production Ready";
  if (score >= 70) return "Hackathon Ready";
  if (score >= 50) return "Development Phase";
  return "Early Stage";
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#1e293b", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
        <div style={{ fontWeight: 600, marginBottom: 2, color: "#64748b" }}>{label}</div>
        <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>{payload[0].value}<span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>/100</span></div>
      </div>
    );
  }
  return null;
};

export default function App({ onLogout, onAnalyze }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [github, setGithub] = useState("");
  const [folderFiles, setFolderFiles] = useState([]);
  const [folderUploaded, setFolderUploaded] = useState(false);
  const [live, setLive] = useState("");

  const analyzeEnabled = github || folderUploaded || live;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; }
        .card { background: #fff; border-radius: 14px; border: 1px solid #e8edf2; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .sidebar-nav { display: flex; align-items: center; gap: 9px; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.15s; }
        .sidebar-nav:hover { background: #334155 !important; color: #fff !important; }
        .input-field { transition: border-color 0.2s, box-shadow 0.2s; }
        .input-field:focus { border-color: #3b82f6 !important; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .btn-analyze { transition: all 0.2s; }
        .btn-analyze:hover:not(:disabled) { background: #2563eb !important; box-shadow: 0 6px 20px rgba(59,130,246,0.45) !important; transform: translateY(-1px); }
        .file-card { transition: all 0.2s; }
        .file-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.1) !important; }
        .stat-card { transition: all 0.15s; }
        .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; transform: translateY(-1px); }
        input[type="file"]::-webkit-file-upload-button { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer; color: #475569; margin-right: 6px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .progress-bar { height: 6px; border-radius: 99px; background: #e2e8f0; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
        .issue-row { transition: all 0.15s; }
        .issue-row:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif", color: "#1e293b" }}>

        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 99, backdropFilter: "blur(2px)" }} />
            <aside style={{ position: "fixed", top: 0, left: 0, width: 232, height: "100vh", background: "#0f172a", zIndex: 100, display: "flex", flexDirection: "column", padding: "20px 14px", boxShadow: "6px 0 24px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 28, paddingLeft: 6 }}>
                <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#3b82f6,#6366f1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff" }}>A</div>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>APAS</span>
              </div>
              {[["Dashboard", BarChart2, true], ["Previous Chats", BookOpen, false], ["Repositories", GitBranch, false]].map(([label, Icon, active], i) => (
                <div key={i} className="sidebar-nav" style={{ color: active ? "#fff" : "#64748b", background: active ? "rgba(59,130,246,0.18)" : "transparent", marginBottom: 3 }}>
                  <Icon size={15} style={{ color: active ? "#60a5fa" : "#475569" }} />{label}
                </div>
              ))}
              <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid #1e293b" }}>
                <div className="sidebar-nav" onClick={onLogout} style={{ color: "#f87171" }}>
                  <LogOut size={14} /> Logout
                </div>
              </div>
            </aside>
          </>
        )}

        <div style={{ flex: 1 }}>
          {/* Topbar */}
          <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e8edf2", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: 4, borderRadius: 6 }}>
                <Menu size={19} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Home</span>
                <span style={{ fontSize: 12, color: "#cbd5e1" }}>/</span>
                <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Dashboard</span>
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "5px 12px 5px 7px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>T</div>
                Tanjiro ▾
              </button>
              {dropdownOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 6, minWidth: 130, zIndex: 200, boxShadow: "0 8px 28px rgba(0,0,0,0.13)" }}>
                  <div onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
                    <LogOut size={13} /> Logout
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div style={{ padding: "28px 32px", maxWidth: 1400 }}>

            {/* Welcome */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 3, letterSpacing: "-0.4px" }}>Welcome back, Tanjiro</h1>
              <p style={{ fontSize: 13, color: "#64748b" }}>Here's your project performance overview for the latest analysis.</p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
              {statCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="card stat-card" style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${stat.color}16`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={17} style={{ color: stat.color }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: stat.up === true ? "#dcfce7" : stat.up === false ? "#fee2e2" : "#f1f5f9", color: stat.up === true ? "#16a34a" : stat.up === false ? "#ef4444" : "#64748b", display: "flex", alignItems: "center", gap: 2 }}>
                        {stat.up === true ? <ArrowUpRight size={11} /> : stat.up === false ? <ArrowDownRight size={11} /> : null}{stat.delta}
                      </span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 2, letterSpacing: "-0.5px" }}>{stat.value}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{stat.label}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{stat.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Alert Banner */}
            <div style={{ padding: "14px 18px", marginBottom: 20, borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", borderLeft: "4px solid #f59e0b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={15} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>Analysis Status Needs Attention</span>
                <span style={{ fontSize: 12, color: "#a16207", marginLeft: 2 }}>Some areas need improvement.</span>
              </div>
              <div style={{ paddingLeft: 23, display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  "Test coverage dropped below 60% — particularly in auth.js and database.sql.",
                  "Security score in App.jsx shows a declining trend with ~15% decrease vs previous analysis.",
                  "Recommended to focus on auth.js where security metrics are consistently below 70%.",
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: "#78350f" }}>
                    <Zap size={11} style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }} />{tip}
                  </div>
                ))}
              </div>
            </div>

            {/* Input Section */}
            <div className="card" style={{ padding: "18px 22px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Project Sources</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Provide at least one source to run analysis</div>
                </div>
                <button
                  disabled={!analyzeEnabled}
                  className="btn-analyze"
                  onClick={() => {
                    if (onAnalyze) {
                      const source = github ? "github"
                        : folderUploaded ? "folder"
                        : "live";
                      onAnalyze({ source, github, folderFiles, live });
                    }
                  }}
                  style={{ padding: "9px 22px", borderRadius: 9, fontSize: 13, fontWeight: 700, border: "none", cursor: analyzeEnabled ? "pointer" : "not-allowed", background: analyzeEnabled ? "#3b82f6" : "#e2e8f0", color: analyzeEnabled ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", gap: 6, boxShadow: analyzeEnabled ? "0 3px 12px rgba(59,130,246,0.35)" : "none" }}
                >
                  <Activity size={13} /> Analyze Project
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {/* GitHub */}
                <div style={{ position: "relative" }}>
                  <Github size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                  <input type="text" placeholder="GitHub repository URL" value={github} onChange={(e) => setGithub(e.target.value)} className="input-field" style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 8, border: `1px solid ${github ? "#3b82f6" : "#e2e8f0"}`, fontSize: 13, color: "#0f172a", background: github ? "#eff6ff" : "#f8fafc" }} />
                </div>
                {/* Live URL */}
                <div style={{ position: "relative" }}>
                  <Globe size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                  <input type="text" placeholder="Live project URL" value={live} onChange={(e) => setLive(e.target.value)} className="input-field" style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 8, border: `1px solid ${live ? "#3b82f6" : "#e2e8f0"}`, fontSize: 13, color: "#0f172a", background: live ? "#eff6ff" : "#f8fafc" }} />
                </div>
                {/* Folder Upload */}
                <div style={{ position: "relative" }}>
                  <FolderOpen size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: folderUploaded ? "#10b981" : "#94a3b8", pointerEvents: "none", zIndex: 1 }} />
                  <input type="file" webkitdirectory="true" directory="" multiple onChange={(e) => { if (e.target.files.length > 0) { setFolderUploaded(true); setFolderFiles(Array.from(e.target.files)); } }} className="input-field" style={{ width: "100%", padding: "10px 32px 10px 34px", borderRadius: 8, border: `1px solid ${folderUploaded ? "#10b981" : "#e2e8f0"}`, fontSize: 12, color: "#64748b", background: folderUploaded ? "#f0fdf4" : "#f8fafc", cursor: "pointer" }} />
                  {folderUploaded && <CheckCircle size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#10b981" }} />}
                </div>
              </div>
            </div>

            {/* File Performance */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>File Performance</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Metric breakdown per file — Quality, Structure, Tests, Security</div>
                </div>
                <div style={{ display: "flex", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 9, padding: 3, gap: 2 }}>
                  {["bar", "line"].map(type => (
                    <button key={type} onClick={() => setChartType(type)} style={{ padding: "5px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: chartType === type ? "#fff" : "transparent", color: chartType === type ? "#0f172a" : "#64748b", boxShadow: chartType === type ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
                      {type === "bar" ? "Bar" : "Line"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {files.map((file, index) => {
                  const color = fileColors[index % fileColors.length];
                  const metrics = fileMetricsData[index];
                  const avg = getScoreAvg(metrics);
                  const trend = fileTrends[index];
                  const isGood = avg >= 75;
                  return (
                    <div key={index} className="card file-card" style={{ padding: "18px 18px 14px", borderTop: `3px solid ${color}` }}>
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Code2 size={14} style={{ color }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{file}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>Avg score: <b style={{ color: "#475569" }}>{avg}</b>/100</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: isGood ? "#dcfce7" : "#fee2e2", color: isGood ? "#16a34a" : "#ef4444" }}>
                            {isGood ? "Good" : "Needs Focus"}
                          </span>
                          <span style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, color: trend === "Improving" ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                            {trend === "Improving" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{trend}
                          </span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div style={{ marginBottom: 12 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${avg}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
                        </div>
                      </div>

                      {/* Chart */}
                      <ResponsiveContainer width="100%" height={120}>
                        {chartType === "bar" ? (
                          <BarChart data={metrics} barSize={16} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={color} fillOpacity={0.8} />
                          </BarChart>
                        ) : (
                          <LineChart data={metrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <CartesianGrid stroke="#f1f5f9" />
                            <XAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3.5, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Readiness + Issues */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Readiness */}
              <div className="card" style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Project Readiness</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Overall health across all metrics</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <ResponsiveContainer width={130} height={130}>
                      <PieChart>
                        <Pie data={readinessData} innerRadius={44} outerRadius={63} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                          <Cell fill="#3b82f6" />
                          <Cell fill="#e2e8f0" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{readinessScore}%</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6", marginBottom: 2 }}>{getReadinessLabel(readinessScore)}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>completion score</div>
                    {[["Tests Coverage", 63, "#f59e0b"], ["Security Avg", 77, "#10b981"], ["Code Quality", 81, "#3b82f6"]].map(([label, val, col]) => (
                      <div key={label} style={{ marginBottom: 9 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>{label}</span>
                          <span style={{ fontWeight: 700, color: "#334155" }}>{val}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: 5 }}>
                          <div className="progress-fill" style={{ width: `${val}%`, background: col }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Issues */}
              <div className="card" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Issues & Improvements</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Priority items to address</div>
                  </div>
                  <span style={{ background: "#fee2e2", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>3 issues</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {issues.map((item, i) => (
                    <div key={i} className="issue-row" style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #e8edf2", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <AlertTriangle size={14} style={{ color: item.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.issue}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{item.file} · {item.type}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: item.bg, color: item.color, flexShrink: 0 }}>
                        {item.priority}
                      </span>
                    </div>
                  ))}
                </div>

                <button style={{ width: "100%", padding: "10px", borderRadius: 9, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", marginTop: 14, boxShadow: "0 3px 12px rgba(59,130,246,0.3)", transition: "all 0.2s" }}>
                Improvements
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}