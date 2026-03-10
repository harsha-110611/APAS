import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Sparkles, Bot, User, Send, CheckCircle,
  AlertTriangle, Shield, Code2, Zap, TrendingUp,
  ChevronDown, ChevronUp, Copy, Check, RefreshCw,
  FileCode, Star, Target, Lightbulb, ArrowRight,
  Activity, Hash
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

function getLang(filename) {
  const ext = filename?.split(".").pop().toLowerCase();
  const map = { js:"JavaScript",jsx:"React/JSX",ts:"TypeScript",tsx:"TypeScript React",py:"Python",java:"Java",cpp:"C++",c:"C",cs:"C#",go:"Go",rb:"Ruby",php:"PHP",swift:"Swift",kt:"Kotlin",rs:"Rust",html:"HTML",css:"CSS",scss:"SCSS",json:"JSON",md:"Markdown",sql:"SQL",sh:"Shell",yml:"YAML",yaml:"YAML",xml:"XML",vue:"Vue" };
  return map[ext] || ext?.toUpperCase() || "File";
}

function getRiskLevel(score) {
  if (score >= 80) return { label:"Low",      color:"#16a34a", bg:"#dcfce7" };
  if (score >= 60) return { label:"Medium",   color:"#ca8a04", bg:"#fef9c3" };
  if (score >= 40) return { label:"High",     color:"#ea580c", bg:"#ffedd5" };
  return             { label:"Critical",  color:"#dc2626", bg:"#fee2e2" };
}

const PRIORITY_COLORS = {
  Critical: { color:"#dc2626", bg:"#fee2e2", border:"#fca5a5" },
  High:     { color:"#ea580c", bg:"#ffedd5", border:"#fdba74" },
  Medium:   { color:"#ca8a04", bg:"#fef9c3", border:"#fde047" },
  Low:      { color:"#16a34a", bg:"#dcfce7", border:"#86efac" },
};

function buildImprovements(files, fileMetrics) {
  const allMetrics = files.map(f => ({ file:f, m:fileMetrics[f.path]||fileMetrics[f.name] })).filter(x=>x.m);
  const sorted     = [...allMetrics].sort((a,b)=>a.m.avgScore-b.m.avgScore);
  return {
    sorted,
    critical:       sorted.filter(x=>x.m.avgScore<45),
    high:           sorted.filter(x=>x.m.avgScore>=45&&x.m.avgScore<60),
    medium:         sorted.filter(x=>x.m.avgScore>=60&&x.m.avgScore<75),
    weakSecurity:   [...allMetrics].sort((a,b)=>a.m.security-b.m.security).slice(0,5),
    weakQuality:    [...allMetrics].sort((a,b)=>a.m.quality-b.m.quality).slice(0,5),
    weakMaintain:   [...allMetrics].sort((a,b)=>a.m.maintainability-b.m.maintainability).slice(0,5),
    highComplexity: [...allMetrics].sort((a,b)=>a.m.complexity-b.m.complexity).slice(0,5),
  };
}

function getFileTips(file, metrics) {
  const ext  = file.name.split(".").pop().toLowerCase();
  const lang = getLang(file.name);
  const tips = [];

  if (metrics.security < 65) {
    const secTips = {
      js:"Add input validation and sanitize all user inputs. Avoid eval() and innerHTML assignments.",
      jsx:"Use React's built-in XSS protection. Avoid dangerouslySetInnerHTML. Validate props with PropTypes.",
      ts:"Enable strict mode in tsconfig. Add runtime validation with Zod or Yup.",
      py:"Use parameterized queries for DB calls. Avoid pickle for untrusted data. Add input validation.",
      php:"Use prepared statements, never raw SQL. Escape all output with htmlspecialchars().",
      sql:"Ensure all queries use parameterized inputs. Remove dynamic query construction.",
      html:"Add Content-Security-Policy meta tag. Use rel='noopener noreferrer' on external links.",
    };
    tips.push({ type:"Security", priority:"High", icon:Shield, color:"#ef4444", text:secTips[ext]||`Review ${lang} security best practices. Add input validation and output encoding.` });
  }

  if (metrics.quality < 65) {
    const qualTips = {
      js:"Break functions >30 lines into smaller units. Add JSDoc comments. Remove dead code.",
      jsx:"Split large components into smaller reusable ones. Move logic to custom hooks. Add PropTypes.",
      ts:"Define strict types for all parameters and return values. Avoid 'any' type.",
      py:"Follow PEP8. Add docstrings to all functions. Keep functions under 20 lines.",
      php:"Use PSR-12 coding standards. Add type hints to all method signatures.",
      css:"Group related styles. Use CSS variables for repeated values. Remove unused selectors.",
    };
    tips.push({ type:"Code Quality", priority:"Medium", icon:Code2, color:"#3b82f6", text:qualTips[ext]||`Refactor ${lang} code for clarity. Reduce function complexity and add documentation.` });
  }

  if (metrics.maintainability < 65)
    tips.push({ type:"Maintainability", priority:"Medium", icon:TrendingUp, color:"#8b5cf6", text:`Add inline comments for complex logic. Extract constants. Ensure consistent naming conventions throughout ${file.name}.` });

  if (metrics.complexity < 50)
    tips.push({ type:"Complexity", priority:"Low", icon:Zap, color:"#f59e0b", text:`High complexity detected. Break nested conditions into guard clauses. Use early returns to reduce nesting depth in ${file.name}.` });

  if (metrics.linesOfCode > 300)
    tips.push({ type:"File Size", priority:"Low", icon:FileCode, color:"#06b6d4", text:`File has ${metrics.linesOfCode} lines — consider splitting into smaller modules. Large files are harder to test and maintain.` });

  if (metrics.comments < metrics.linesOfCode * 0.05)
    tips.push({ type:"Documentation", priority:"Low", icon:Lightbulb, color:"#84cc16", text:`Only ${metrics.comments} comment lines detected. Add function-level documentation explaining purpose, params, and return values.` });

  if (tips.length === 0)
    tips.push({ type:"Well Written", priority:"Low", icon:Star, color:"#10b981", text:`${file.name} scores ${metrics.avgScore}/100. Minor improvements: ensure tests exist, add error boundaries, and review edge cases.` });

  return tips;
}

// ── AI Response (simulated streaming) ─────────────────────────────────────

function buildSystemPrompt(payload) {
  const { files=[], fileMetrics={}, sourceType, avgOverall=0, avgSecurity=0, issueCount=0, totalLines=0 } = payload||{};
  const allM = files.map(f=>({ name:f.name, ...(fileMetrics[f.path]||fileMetrics[f.name]||{}) }));
  const worst5 = [...allM].sort((a,b)=>(a.avgScore||0)-(b.avgScore||0)).slice(0,5);
  return `You are APAS Improvement Assistant, an expert code review AI. Be direct, specific, and actionable.

PROJECT ANALYSIS SUMMARY:
- Source: ${sourceType} project
- Overall Score: ${avgOverall}/100
- Files Analyzed: ${files.length}
- Total Lines: ${totalLines?.toLocaleString()||"N/A"}
- Security Score: ${avgSecurity}%
- Files Needing Review: ${issueCount}

WORST 5 FILES:
${worst5.map(f=>`- ${f.name}: score ${f.avgScore||0}/100, security ${f.security||0}%, quality ${f.quality||0}%`).join("\n")}

ALL FILES (score):
${allM.slice(0,25).map(f=>`${f.name}:${f.avgScore||0}`).join(", ")}

Rules:
- Give specific, actionable improvements with code examples when asked
- Reference actual file names from the analysis
- Prioritize Critical > High > Medium > Low issues
- Keep responses concise and structured
- When giving code examples, use proper markdown code blocks with language tags`};

// ── UI Atoms ──────────────────────────────────────────────────────────────
async function callAI(messages, systemPrompt, onChunk, onDone, onError) {
  try {
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    const res = await fetch("http://localhost:5001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: lastUserMessage,
        projectContext: {
          systemPrompt
        }
      })
    });

    if (!res.ok) throw new Error("Backend error");

    const data = await res.json();
    const text = data.reply || "No response received.";

    // simple fake streaming effect
    let i = 0;
    const tick = () => {
      i += 15;
      if (i >= text.length) {
        onChunk(text);
        onDone(text);
      } else {
        onChunk(text.slice(0, i));
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);

  } catch (e) {
    onError("Couldn't connect to AI. Check backend server.");
  }
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async()=>{ await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),1500); }} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid #334155", background:"#1e293b", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#94a3b8" }}>
      {copied ? <><Check size={11} style={{ color:"#10b981" }}/>Copied</> : <><Copy size={11}/>Copy</>}
    </button>
  );
}

function RenderMessage({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div style={{ lineHeight:1.65 }}>
      {parts.map((part,i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3).split("\n");
          const lang  = lines[0].trim();
          const code  = lines.slice(1).join("\n").replace(/```$/,"").trim();
          return (
            <div key={i} style={{ margin:"10px 0" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 12px", background:"#1e293b", borderRadius:"8px 8px 0 0" }}>
                <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{lang||"code"}</span>
                <CopyBtn text={code}/>
              </div>
              <pre style={{ margin:0, padding:"14px 16px", background:"#0f172a", borderRadius:"0 0 8px 8px", overflowX:"auto", fontSize:12, lineHeight:1.7, color:"#e2e8f0", fontFamily:"'JetBrains Mono','Fira Code',monospace" }}>{code}</pre>
            </div>
          );
        }
        const bold = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {bold.map((b,j) => b.startsWith("**")
              ? <strong key={j} style={{ color:"#0f172a", fontWeight:700 }}>{b.slice(2,-2)}</strong>
              : <span key={j}>{b}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ── File Card ─────────────────────────────────────────────────────────────

function FileImprovementCard({ file, metrics, rank, onAskAI }) {
  const [open, setOpen] = useState(rank <= 2);
  const tips = getFileTips(file, metrics);
  const risk = getRiskLevel(metrics.avgScore);

  return (
    <div className="ficard" style={{ background:"#fff", borderRadius:13, border:"1px solid #e8edf2", borderLeft:`4px solid ${risk.color}`, overflow:"hidden" }}>
      <div onClick={()=>setOpen(!open)} style={{ padding:"14px 18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:risk.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:risk.color, flexShrink:0 }}>{rank}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{file.name}</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:1, display:"flex", gap:8 }}>
              <span>{getLang(file.name)}</span><span>·</span>
              <span style={{ color:risk.color, fontWeight:600 }}>{risk.label} Risk</span><span>·</span>
              <span>{metrics.avgScore}/100</span>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", gap:6 }}>
            {[["Security",metrics.security],["Quality",metrics.quality],["Maintain.",metrics.maintainability]].map(([label,val])=>{
              const c = val>=70?"#10b981":val>=50?"#f59e0b":"#ef4444";
              return (
                <div key={label} style={{ textAlign:"center", padding:"4px 8px", background:"#f8fafc", borderRadius:7, border:"1px solid #e2e8f0" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:c }}>{val}%</div>
                  <div style={{ fontSize:9, color:"#94a3b8" }}>{label}</div>
                </div>
              );
            })}
          </div>
          {open ? <ChevronUp size={15} style={{ color:"#94a3b8" }}/> : <ChevronDown size={15} style={{ color:"#94a3b8" }}/>}
        </div>
      </div>

      {open && (
        <div style={{ padding:"0 18px 16px", borderTop:"1px solid #f1f5f9" }}>
          <div style={{ paddingTop:14, display:"flex", flexDirection:"column", gap:10 }}>
            {tips.map((tip,i) => {
              const pc=PRIORITY_COLORS[tip.priority], Icon=tip.icon;
              return (
                <div key={i} style={{ background:"#f8fafc", borderRadius:10, border:`1px solid ${pc.border}`, padding:"12px 14px", display:"flex", gap:12 }}>
                  <div style={{ width:30, height:30, borderRadius:7, background:pc.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                    <Icon size={14} style={{ color:tip.color }}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{tip.type}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:pc.bg, color:pc.color, border:`1px solid ${pc.border}` }}>{tip.priority}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#475569", lineHeight:1.6 }}>{tip.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={()=>onAskAI(`Give me specific code improvements for ${file.name} (score: ${metrics.avgScore}/100, security: ${metrics.security}%, quality: ${metrics.quality}%). Show code examples.`)} style={{ marginTop:12, display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:9, background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"#fff", border:"none", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            <Sparkles size={12}/> Ask AI for Code Fixes
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function ImprovementsPage({ payload, user, onBack }) {
  const {
    files=[], fileMetrics={}, sourceType, repoInfo, liveUrl,
    folderName, avgOverall=0, avgSecurity=0, issueCount=0, totalLines=0
  } = payload || {};

  const [tab,       setTab]       = useState("overview");
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState("");
  const bottomRef   = useRef(null);
  const systemPrompt = buildSystemPrompt(payload||{});

  const imp    = buildImprovements(files, fileMetrics);
  const allM   = files.map(f=>({ file:f, m:fileMetrics[f.path]||fileMetrics[f.name]||{} })).filter(x=>x.m.avgScore!==undefined);
  const sorted = [...allM].sort((a,b)=>a.m.avgScore-b.m.avgScore);

  const avgQuality    = allM.length ? Math.round(allM.reduce((a,x)=>a+x.m.quality,0)/allM.length) : 0;
  const avgMaintain   = allM.length ? Math.round(allM.reduce((a,x)=>a+x.m.maintainability,0)/allM.length) : 0;
  const avgComplexity = allM.length ? Math.round(allM.reduce((a,x)=>a+x.m.complexity,0)/allM.length) : 0;

  const projectName = sourceType==="github" ? repoInfo?.full_name||"GitHub Repo"
    : sourceType==="folder" ? folderName||"Local Project"
    : liveUrl||"Live Project";

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:"smooth" }); },[messages,streamBuf]);

  const sendMessage = (overrideText) => {
    const text = (overrideText||input).trim();
    if (!text||streaming) return;
    setInput("");
    setTab("chat");
    const userMsg = { role:"user", content:text, id:Date.now() };
    setMessages(prev=>[...prev, userMsg]);
    setStreaming(true); setStreamBuf("");
    callAI(
      [...messages, userMsg], systemPrompt,
      chunk => setStreamBuf(chunk),
      final => { setMessages(prev=>[...prev,{ role:"assistant", content:final, id:Date.now()+1 }]); setStreamBuf(""); setStreaming(false); },
      err   => { setMessages(prev=>[...prev,{ role:"assistant", content:err,   id:Date.now()+1 }]); setStreamBuf(""); setStreaming(false); }
    );
  };

  const handleAskAI = (q) => { setTab("chat"); setTimeout(()=>sendMessage(q), 50); };

  const overviewCards = [
    { label:"Overall Score",   value:`${avgOverall}/100`,  color:"#3b82f6", ok:avgOverall>=70,  icon:Activity,    status:avgOverall>=70?"Good":"Review" },
    { label:"Code Quality",    value:`${avgQuality}%`,     color:"#10b981", ok:avgQuality>=70,  icon:Code2,       status:avgQuality>=70?"Good":"Improve" },
    { label:"Security",        value:`${avgSecurity}%`,    color:"#ef4444", ok:avgSecurity>=70, icon:Shield,      status:avgSecurity>=70?"Secure":"Risk" },
    { label:"Maintainability", value:`${avgMaintain}%`,    color:"#8b5cf6", ok:avgMaintain>=70, icon:TrendingUp,  status:avgMaintain>=70?"Good":"Fix" },
    { label:"Complexity",      value:`${avgComplexity}%`,  color:"#f59e0b", ok:avgComplexity>=60,icon:Zap,        status:avgComplexity>=60?"OK":"High" },
    { label:"Files to Fix",    value:issueCount,           color:"#f43f5e", ok:issueCount===0,  icon:Target,      status:issueCount===0?"Clean":"Action" },
  ];

  const quickPrompts = [
    "What are the top 3 critical fixes I should do first?",
    "Give me a security hardening checklist for this project",
    "Which files should I refactor and how?",
    "Generate a prioritized improvement roadmap",
    "What design patterns would improve this codebase?",
    "How can I improve test coverage for this project?",
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f1f5f9;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .ficard{transition:box-shadow 0.2s;} .ficard:hover{box-shadow:0 6px 20px rgba(0,0,0,0.08)!important;}
        .qp-btn:hover{border-color:#6366f1!important;color:#6366f1!important;background:#f5f3ff!important;}
        .send-btn:hover:not(:disabled){background:linear-gradient(135deg,#2563eb,#4f46e5)!important;transform:scale(1.05);}
        .fade-in{animation:fadeIn 0.3s ease both;}
        .chat-input:focus{border-color:#6366f1!important;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,0.12);}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Inter',sans-serif" }}>

        {/* Topbar */}
        <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(255,255,255,0.94)", backdropFilter:"blur(10px)", borderBottom:"1px solid #e8edf2", padding:"0 28px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:7, background:"none", border:"none", cursor:"pointer", color:"#64748b", fontSize:13, fontWeight:600, padding:"6px 10px", borderRadius:8 }}>
              <ArrowLeft size={16}/> Back to Analysis
            </button>
            <div style={{ width:1, height:20, background:"#e2e8f0" }}/>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12 }}>
              <span style={{ color:"#64748b" }}>Analysis</span>
              <span style={{ color:"#cbd5e1" }}>/</span>
              <span style={{ color:"#8b5cf6", fontWeight:700, display:"flex", alignItems:"center", gap:5 }}><Sparkles size={12}/>Improvements</span>
              <span style={{ color:"#cbd5e1" }}>/</span>
              <span style={{ fontWeight:700, color:"#0f172a", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{projectName}</span>
            </div>
          </div>
          <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"linear-gradient(135deg,#f5f3ff,#eff6ff)", color:"#6366f1", border:"1px solid #ddd6fe" }}>AI-Powered Insights</span>
        </div>

        {/* Hero */}
        <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", padding:"28px 32px 24px" }}>
          <div style={{ maxWidth:1060, margin:"0 auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Sparkles size={22} style={{ color:"#fff" }}/>
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:"#f1f5f9", letterSpacing:"-0.4px" }}>Improvements Report</div>
                <div style={{ fontSize:13, color:"#94a3b8", marginTop:1 }}>{projectName} · {files.length} files analyzed</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
              {overviewCards.map((c,i)=>{
                const Icon=c.icon;
                return (
                  <div key={i} style={{ background:"rgba(255,255,255,0.07)", backdropFilter:"blur(10px)", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", padding:"14px 12px", textAlign:"center" }}>
                    <Icon size={16} style={{ color:c.color, marginBottom:6 }}/>
                    <div style={{ fontSize:18, fontWeight:900, color:"#f1f5f9", marginBottom:3 }}>{c.value}</div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginBottom:5 }}>{c.label}</div>
                    <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, background:c.ok?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)", color:c.ok?"#34d399":"#fca5a5", border:`1px solid ${c.ok?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}` }}>{c.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background:"#fff", borderBottom:"1px solid #e8edf2", padding:"0 32px", display:"flex", gap:2 }}>
          {[
            { id:"overview", label:"Overview",       icon:Target },
            { id:"files",    label:`Files (${sorted.length})`, icon:FileCode },
            { id:"chat",     label:"AI Assistant",   icon:Bot },
          ].map(({ id,label,icon:Icon })=>(
            <button key={id} onClick={()=>setTab(id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"14px 18px", border:"none", background:"transparent", cursor:"pointer", fontSize:13, fontWeight:tab===id?700:500, color:tab===id?"#0f172a":"#64748b", borderBottom:tab===id?"2px solid #6366f1":"2px solid transparent", transition:"all 0.15s" }}>
              <Icon size={14}/>{label}
              {id==="chat"&&messages.length>0&&<span style={{ fontSize:10, fontWeight:700, background:"#6366f1", color:"#fff", padding:"1px 6px", borderRadius:20 }}>{messages.filter(m=>m.role==="user").length}</span>}
            </button>
          ))}
        </div>

        <div style={{ padding:"24px 32px", maxWidth:1100, margin:"0 auto" }}>

          {/* ── OVERVIEW ── */}
          {tab==="overview" && (
            <div className="fade-in">
              {/* Priority action plan */}
              <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e8edf2", padding:"22px 24px", marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}><Target size={16} style={{ color:"#3b82f6" }}/></div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>Priority Action Plan</div>
                    <div style={{ fontSize:12, color:"#94a3b8" }}>Start with these for the biggest score improvement</div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[...imp.critical.slice(0,3), ...imp.high.slice(0,3)].map((x,i)=>{
                    const isCrit = i < imp.critical.slice(0,3).length;
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:isCrit?"#fff7ed":"#fffbeb", border:`1px solid ${isCrit?"#fed7aa":"#fde68a"}`, borderRadius:10 }}>
                        <span style={{ fontSize:17, fontWeight:900, color:isCrit?"#ea580c":"#ca8a04", width:28, textAlign:"center", flexShrink:0 }}>#{i+1}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{x.file.name}</div>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>Score: {x.m.avgScore}/100 · Security: {x.m.security}% · Quality: {x.m.quality}%</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:isCrit?"#fee2e2":"#fef9c3", color:isCrit?"#dc2626":"#ca8a04" }}>{isCrit?"Critical":"High"}</span>
                        <button onClick={()=>handleAskAI(`How do I fix ${x.file.name}? Score is ${x.m.avgScore}/100, security ${x.m.security}%, quality ${x.m.quality}%. Give me specific code improvements.`)} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 13px", borderRadius:8, background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"#fff", border:"none", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                          <Sparkles size={10}/> Fix with AI
                        </button>
                      </div>
                    );
                  })}
                  {imp.critical.length===0 && imp.high.length===0 && (
                    <div style={{ padding:"24px", textAlign:"center", color:"#10b981", fontSize:14, fontWeight:700 }}>
                      ✅ No critical or high priority issues! Your project is in great shape.
                    </div>
                  )}
                </div>
              </div>

              {/* Category cards */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                {[
                  { label:"Security Improvements",   files:imp.weakSecurity,   color:"#ef4444", bg:"#fee2e2", icon:Shield,     key:"security" },
                  { label:"Quality Improvements",    files:imp.weakQuality,    color:"#3b82f6", bg:"#eff6ff", icon:Code2,      key:"quality" },
                  { label:"Maintainability Fixes",   files:imp.weakMaintain,   color:"#8b5cf6", bg:"#f5f3ff", icon:TrendingUp, key:"maintainability" },
                  { label:"Reduce Complexity",       files:imp.highComplexity, color:"#f59e0b", bg:"#fffbeb", icon:Zap,        key:"complexity" },
                ].map(({ label,files:flist,color,bg,icon:Icon,key })=>(
                  <div key={key} style={{ background:"#fff", borderRadius:12, border:"1px solid #e8edf2", padding:"18px 20px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <div style={{ width:28, height:28, borderRadius:7, background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon size={13} style={{ color }}/></div>
                      <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{label}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {flist.slice(0,5).map((x,i)=>{
                        const val = x.m[key]||x.m.avgScore;
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:12, color:"#0f172a", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>{x.file.name}</span>
                            <div style={{ width:80, height:5, borderRadius:99, background:"#e2e8f0", overflow:"hidden", flexShrink:0 }}>
                              <div style={{ height:"100%", width:`${val}%`, borderRadius:99, background:color }}/>
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color, flexShrink:0, width:32, textAlign:"right" }}>{val}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={()=>handleAskAI(`How do I improve ${label.toLowerCase()} in my project? Focus on the weakest files and give specific examples.`)} style={{ marginTop:14, display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color, background:"none", border:`1px solid ${color}33`, borderRadius:7, padding:"6px 12px", cursor:"pointer" }}>
                      <Sparkles size={10}/> Get AI tips
                    </button>
                  </div>
                ))}
              </div>

              {/* Chat CTA */}
              <div style={{ background:"linear-gradient(135deg,#f5f3ff,#eff6ff)", border:"1px solid #ddd6fe", borderRadius:14, padding:"22px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center" }}><Bot size={20} style={{ color:"#fff" }}/></div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>Chat with AI about your project</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>Ask for code fixes, refactoring, architecture, security patches</div>
                  </div>
                </div>
                <button onClick={()=>setTab("chat")} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:10, background:"linear-gradient(135deg,#6366f1,#3b82f6)", color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(99,102,241,0.4)" }}>
                  Open AI Chat <ArrowRight size={14}/>
                </button>
              </div>
            </div>
          )}

          {/* ── FILES TAB ── */}
          {tab==="files" && (
            <div className="fade-in">
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:16, fontWeight:800, color:"#0f172a", marginBottom:3 }}>File-by-File Improvements</div>
                <div style={{ fontSize:12, color:"#94a3b8" }}>Sorted by priority — worst first. Expand any file for specific action items.</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {sorted.map((x,i)=>(
                  <FileImprovementCard key={x.file.path||x.file.name} file={x.file} metrics={x.m} rank={i+1} onAskAI={handleAskAI}/>
                ))}
              </div>
            </div>
          )}

          {/* ── AI CHAT TAB ── */}
          {tab==="chat" && (
            <div className="fade-in" style={{ display:"flex", gap:20, alignItems:"flex-start" }}>

              <div style={{ flex:1, background:"#fff", borderRadius:16, border:"1px solid #e8edf2", overflow:"hidden", display:"flex", flexDirection:"column", minHeight:580 }}>
                {/* Chat header */}
                <div style={{ padding:"16px 20px", background:"linear-gradient(135deg,#0f172a,#1e1b4b)", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center" }}><Bot size={18} style={{ color:"#fff" }}/></div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>APAS Improvement AI</div>
                    <div style={{ fontSize:11, color:"#10b981", fontWeight:600 }}>● Trained on your analysis · {files.length} files in context</div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:16, minHeight:400 }}>
                  {messages.length===0&&!streaming&&(
                    <div style={{ textAlign:"center", padding:"30px 0" }}>
                      <div style={{ fontSize:40, marginBottom:14 }}>🤖</div>
                      <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:6 }}>I know your entire project</div>
                      <div style={{ fontSize:13, color:"#64748b", lineHeight:1.6, maxWidth:360, margin:"0 auto" }}>
                        Ask me for specific code fixes, refactoring suggestions, security patches, or a complete improvement roadmap.
                      </div>
                    </div>
                  )}
                  {messages.map(msg=>(
                    <div key={msg.id} style={{ display:"flex", gap:10, alignItems:"flex-start", flexDirection:msg.role==="user"?"row-reverse":"row" }}>
                      <div style={{ width:30, height:30, borderRadius:8, background:msg.role==="user"?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {msg.role==="user"?<User size={13} style={{ color:"#fff" }}/>:<Bot size={13} style={{ color:"#fff" }}/>}
                      </div>
                      <div style={{ maxWidth:"80%", padding:"12px 16px", borderRadius:msg.role==="user"?"14px 4px 14px 14px":"4px 14px 14px 14px", background:msg.role==="user"?"#0f172a":"#fff", color:msg.role==="user"?"#f1f5f9":"#334155", fontSize:13, border:msg.role==="assistant"?"1px solid #e8edf2":"none", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                        {msg.role==="assistant"?<RenderMessage text={msg.content}/>:msg.content}
                      </div>
                    </div>
                  ))}
                  {streaming&&streamBuf&&(
                    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center" }}><Bot size={13} style={{ color:"#fff" }}/></div>
                      <div style={{ maxWidth:"80%", padding:"12px 16px", borderRadius:"4px 14px 14px 14px", background:"#fff", border:"1px solid #e8edf2", fontSize:13, color:"#334155" }}>
                        <RenderMessage text={streamBuf}/><span style={{ display:"inline-block", width:8, height:14, background:"#6366f1", borderRadius:2, marginLeft:2, animation:"pulse 0.8s infinite", verticalAlign:"text-bottom" }}/>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef}/>
                </div>

                {/* Input */}
                <div style={{ padding:"14px 16px", borderTop:"1px solid #e8edf2", display:"flex", gap:10 }}>
                  <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(); } }} placeholder="Ask for specific fixes, code examples, refactoring ideas..." disabled={streaming} className="chat-input" style={{ flex:1, padding:"11px 16px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:13, color:"#0f172a", background:"#f8fafc", fontFamily:"'Inter',sans-serif", transition:"border-color 0.2s" }}/>
                  <button onClick={()=>sendMessage()} disabled={!input.trim()||streaming} className="send-btn" style={{ width:42, height:42, borderRadius:10, background:input.trim()&&!streaming?"linear-gradient(135deg,#3b82f6,#6366f1)":"#e2e8f0", border:"none", cursor:input.trim()&&!streaming?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                    {streaming?<RefreshCw size={15} style={{ color:"#94a3b8", animation:"spin 1s linear infinite" }}/>:<Send size={15} style={{ color:input.trim()?"#fff":"#94a3b8" }}/>}
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div style={{ width:240, flexShrink:0, display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e8edf2", padding:"16px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0f172a", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}><Lightbulb size={13} style={{ color:"#f59e0b" }}/>Quick Questions</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {quickPrompts.map((q,i)=>(
                      <button key={i} onClick={()=>sendMessage(q)} className="qp-btn" style={{ padding:"9px 12px", borderRadius:9, border:"1px solid #e2e8f0", background:"#f8fafc", cursor:"pointer", fontSize:12, color:"#475569", fontWeight:500, textAlign:"left", lineHeight:1.5, transition:"all 0.15s" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                {messages.length>0&&(
                  <button onClick={()=>setMessages([])} style={{ padding:"9px", borderRadius:9, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12, color:"#64748b", fontWeight:500 }}>
                    Clear conversation
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}