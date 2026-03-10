import { useState, useEffect, useRef } from "react";
import {
  X, History, Trash2, Clock, Github, FolderOpen, Globe,
  MessageCircle, Send, ChevronLeft, Bot, User, AlertCircle
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ── Helpers ────────────────────────────────────────────────────────────────

function srcIcon(t)  { return t==="github"?"🐙":t==="folder"?"📁":"🌐"; }
function srcColor(t) { return t==="github"?"#0f172a":t==="folder"?"#10b981":"#8b5cf6"; }
function srcBg(t)    { return t==="github"?"#f1f5f9":t==="folder"?"#f0fdf4":"#f5f3ff"; }

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
}

// ── Chat Panel ─────────────────────────────────────────────────────────────

function ChatPanel({ analysis, user }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);

  // Load existing messages
  useEffect(() => {
    if (!analysis?.id) return;
    supabase
      .from("chat_messages")
      .select("*")
      .eq("analysis_id", analysis.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data || []);
        setLoading(false);
      });
  }, [analysis?.id]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build context from analysis for the AI reply
  function buildContext(analysis) {
    return `You are APAS Assistant, an AI code analysis expert. The user is asking about their project analysis.

Analysis Details:
- Project: ${analysis.source_label}
- Type: ${analysis.source_type} (${analysis.source_type === "github" ? "GitHub repository" : analysis.source_type === "folder" ? "local folder upload" : "live URL"})
- Overall Score: ${analysis.overall_score}/100
- Files Analyzed: ${analysis.files_count}
- Total Lines of Code: ${analysis.total_lines.toLocaleString()}
- Security Score: ${analysis.security_score}%
- Issues Found: ${analysis.issues_count}
- Date Analyzed: ${fmtDate(analysis.created_at)}

Answer questions about this analysis concisely. Give specific, actionable advice. Keep responses under 150 words unless the user asks for detail.`;
  }

  // Simple AI reply using Claude API via Anthropic
  async function getAIReply(userMessage, history) {
    try {
      const contextMsg = buildContext(analysis);
      const msgs = [
        ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage }
      ];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: contextMsg,
          messages: msgs,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      return data.content?.[0]?.text || "Sorry, I couldn't generate a response.";
    } catch {
      return "I couldn't connect right now. Please try again.";
    }
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    // Resolve real user ID (demo users use anonymous Supabase session)
    let userId = user.id;
    if (user.isDemo) {
      const { data: sess } = await supabase.auth.getSession();
      userId = sess?.session?.user?.id || user.id;
    }

    // Save user message to Supabase
    const userMsg = { analysis_id: analysis.id, user_id: userId, role: "user", content: text, created_at: new Date().toISOString() };
    const { data: saved } = await supabase.from("chat_messages").insert(userMsg).select().single();
    const newMessages = [...messages, saved || { ...userMsg, id: Date.now() }];
    setMessages(newMessages);

    // Get AI reply
    const reply = await getAIReply(text, newMessages);

    // Save assistant message
    const assistantMsg = { analysis_id: analysis.id, user_id: userId, role: "assistant", content: reply, created_at: new Date().toISOString() };
    const { data: savedReply } = await supabase.from("chat_messages").insert(assistantMsg).select().single();
    setMessages(prev => [...prev, savedReply || { ...assistantMsg, id: Date.now() + 1 }]);
    setSending(false);
  };

  const handleClearChat = async () => {
    await supabase.from("chat_messages").delete().eq("analysis_id", analysis.id);
    setMessages([]);
  };

  const suggestions = [
    "What are the biggest issues in this project?",
    "How can I improve the security score?",
    "Which files need the most attention?",
    "Give me a summary of this analysis",
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#f8fafc" }}>

      {/* Chat header */}
      <div style={{ padding:"14px 18px", background:"#fff", borderBottom:"1px solid #e8edf2", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Bot size={16} style={{ color:"#fff" }}/>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>APAS Assistant</div>
            <div style={{ fontSize:11, color:"#10b981", fontWeight:600 }}>● Online · Knows your analysis</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClearChat} style={{ fontSize:11, color:"#94a3b8", fontWeight:600, background:"none", border:"1px solid #e2e8f0", borderRadius:7, padding:"4px 10px", cursor:"pointer" }}>
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
        {loading ? (
          <div style={{ textAlign:"center", color:"#94a3b8", fontSize:13, paddingTop:40 }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ textAlign:"center", paddingTop:24 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🤖</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Ask me about this analysis</div>
              <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>I know your full project metrics. Ask anything about scores, issues, or how to improve.</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
              {suggestions.map((s,i)=>(
                <button key={i} onClick={()=>{ setInput(s); }} style={{ padding:"10px 12px", borderRadius:9, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12, color:"#475569", fontWeight:500, textAlign:"left", lineHeight:1.4, transition:"all 0.15s" }}
                  onMouseEnter={e=>e.target.style.borderColor="#3b82f6"}
                  onMouseLeave={e=>e.target.style.borderColor="#e2e8f0"}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id||i} style={{ display:"flex", gap:9, alignItems:"flex-start", flexDirection: msg.role==="user"?"row-reverse":"row" }}>
              <div style={{ width:28, height:28, borderRadius:7, background: msg.role==="user"?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {msg.role==="user" ? <User size={13} style={{ color:"#fff" }}/> : <Bot size={13} style={{ color:"#fff" }}/>}
              </div>
              <div style={{ maxWidth:"75%", padding:"10px 13px", borderRadius: msg.role==="user"?"12px 4px 12px 12px":"4px 12px 12px 12px", background: msg.role==="user"?"#0f172a":"#fff", color: msg.role==="user"?"#f1f5f9":"#334155", fontSize:13, lineHeight:1.6, border: msg.role==="assistant"?"1px solid #e8edf2":"none", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                {msg.content}
                <div style={{ fontSize:10, color: msg.role==="user"?"#64748b":"#94a3b8", marginTop:4 }}>{fmtDate(msg.created_at)}</div>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div style={{ display:"flex", gap:9, alignItems:"flex-start" }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Bot size={13} style={{ color:"#fff" }}/>
            </div>
            <div style={{ padding:"10px 14px", borderRadius:"4px 12px 12px 12px", background:"#fff", border:"1px solid #e8edf2" }}>
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#94a3b8", animation:`bounce 1.2s ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"12px 16px", background:"#fff", borderTop:"1px solid #e8edf2", display:"flex", gap:9, flexShrink:0 }}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleSend(); } }}
          placeholder="Ask about scores, issues, improvements..."
          style={{ flex:1, padding:"10px 14px", borderRadius:9, border:"1px solid #e2e8f0", fontSize:13, color:"#0f172a", background:"#f8fafc", outline:"none" }}
          disabled={sending}
        />
        <button onClick={handleSend} disabled={!input.trim()||sending} style={{ width:38, height:38, borderRadius:9, background: input.trim()&&!sending?"#3b82f6":"#e2e8f0", border:"none", cursor:input.trim()&&!sending?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
          <Send size={15} style={{ color: input.trim()&&!sending?"#fff":"#94a3b8" }}/>
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

// ── History Modal ──────────────────────────────────────────────────────────

export default function HistoryModal({ user, onClose }) {
  const [analyses,  setAnalyses]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);  // opened analysis for chat
  const [deleting,  setDeleting]  = useState(null);
  const [tab,       setTab]       = useState("history"); // "history" | "chat"

  useEffect(() => {
    if (!user) return;
    // For demo user, resolve the real Supabase session user ID first
    const fetchHistory = async () => {
      let userId = user.id;
      if (user.isDemo) {
        const { data: sess } = await supabase.auth.getSession();
        userId = sess?.session?.user?.id;
        if (!userId) { setLoading(false); return; } // no anon session yet = no saved reports
      }
      const { data, error } = await supabase
        .from("analyses")
        .select("id,source_type,source_label,overall_score,files_count,total_lines,security_score,issues_count,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error) setAnalyses(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setDeleting(id);
    await supabase.from("analyses").delete().eq("id", id);
    setAnalyses(a => a.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
  };

  const openChat = (analysis) => {
    setSelected(analysis);
    setTab("chat");
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Inter',sans-serif" }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e8edf2", boxShadow:"0 24px 64px rgba(0,0,0,0.22)", width:"100%", maxWidth:860, height:"82vh", display:"flex", flexDirection:"column", overflow:"hidden" }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"18px 24px", borderBottom:"1px solid #e8edf2", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {selected && tab==="chat" && (
              <button onClick={()=>{ setTab("history"); setSelected(null); }} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:"#475569" }}>
                <ChevronLeft size={14}/> Back
              </button>
            )}
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0f172a", letterSpacing:"-0.3px", display:"flex", alignItems:"center", gap:8 }}>
                {tab==="history"
                  ? <><History size={17} style={{ color:"#3b82f6" }}/>Analysis History</>
                  : <><MessageCircle size={17} style={{ color:"#3b82f6" }}/>Chat · {selected?.source_label}</>}
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                {tab==="history" ? `${analyses.length} saved reports` : `Ask questions about this analysis`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:8, padding:"7px 10px", cursor:"pointer", display:"flex" }}>
            <X size={16} style={{ color:"#64748b" }}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflow:"hidden", display:"flex" }}>

          {/* History list */}
          {tab==="history" && (
            <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
              {loading ? (
                <div style={{ textAlign:"center", padding:"60px 0", color:"#94a3b8", fontSize:13 }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>⏳</div>Loading your history...
                </div>
              ) : analyses.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 0" }}>
                  <div style={{ fontSize:40, marginBottom:14 }}>📭</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:6 }}>No saved reports yet</div>
                  <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6 }}>
                    Run an analysis and click <strong>"Save Report"</strong> in the topbar to store it here.
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {analyses.map(a => (
                    <div key={a.id} style={{ background:"#f8fafc", borderRadius:12, border:"1px solid #e8edf2", padding:"14px 16px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", transition:"all 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#bfdbfe"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="#e8edf2"}
                      onClick={()=>openChat(a)}>

                      {/* Source icon */}
                      <div style={{ width:42, height:42, borderRadius:10, background:srcBg(a.source_type), display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                        {srcIcon(a.source_type)}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.source_label}</div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:3, display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ color:srcColor(a.source_type), fontWeight:600, textTransform:"capitalize" }}>{a.source_type}</span>
                          <span>·</span>
                          <Clock size={10}/>{fmtDate(a.created_at)}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                        {[
                          { label:"Score",    val:`${a.overall_score}/100`,            color:"#3b82f6" },
                          { label:"Files",    val:a.files_count,                       color:"#10b981" },
                          { label:"Lines",    val:a.total_lines.toLocaleString(),      color:"#8b5cf6" },
                          { label:"Issues",   val:a.issues_count,                      color:a.issues_count>0?"#ef4444":"#16a34a" },
                        ].map(({ label, val, color })=>(
                          <div key={label} style={{ textAlign:"center", padding:"5px 10px", background:"#fff", borderRadius:8, border:"1px solid #e2e8f0", minWidth:54 }}>
                            <div style={{ fontSize:13, fontWeight:800, color }}>{val}</div>
                            <div style={{ fontSize:9, color:"#94a3b8", marginTop:1 }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                        <button onClick={e=>{ e.stopPropagation(); openChat(a); }} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:"1px solid #bfdbfe", background:"#eff6ff", cursor:"pointer", fontSize:12, fontWeight:600, color:"#3b82f6" }}>
                          <MessageCircle size={12}/> Chat
                        </button>
                        <button onClick={e=>handleDelete(a.id,e)} disabled={deleting===a.id} style={{ padding:"7px 10px", borderRadius:8, border:"1px solid #fca5a5", background:"#fee2e2", cursor:"pointer", display:"flex", alignItems:"center", opacity:deleting===a.id?0.5:1 }}>
                          <Trash2 size={12} style={{ color:"#ef4444" }}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat panel */}
          {tab==="chat" && selected && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {/* Mini analysis summary bar */}
              <div style={{ padding:"10px 24px", background:"#f8fafc", borderBottom:"1px solid #e8edf2", display:"flex", gap:14, flexShrink:0, overflowX:"auto" }}>
                {[
                  { label:"Overall",  val:`${selected.overall_score}/100`,       color:"#3b82f6" },
                  { label:"Files",    val:selected.files_count,                  color:"#10b981" },
                  { label:"Lines",    val:selected.total_lines.toLocaleString(), color:"#8b5cf6" },
                  { label:"Security", val:`${selected.security_score}%`,         color:"#f59e0b" },
                  { label:"Issues",   val:selected.issues_count,                 color:selected.issues_count>0?"#ef4444":"#16a34a" },
                ].map(({ label, val, color })=>(
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    <span style={{ fontSize:11, color:"#94a3b8" }}>{label}:</span>
                    <span style={{ fontSize:12, fontWeight:800, color }}>{val}</span>
                  </div>
                ))}
              </div>
              <ChatPanel analysis={selected} user={user}/>
            </div>
          )}
        </div>
      </div>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
    </div>
  );
}