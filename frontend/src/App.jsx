import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { DEMO_USER } from "./apas-login";
import Login from "./apas-login";
import Dashboard from "./apas-dashboard";
import AnalysisPage from "./apas-analysis";
import ImprovementsPage from "./apas-improvements";

export default function App() {
  const [page,             setPage]             = useState("login");
  const [user,             setUser]             = useState(null);
  const [analyzePayload,   setAnalyzePayload]   = useState(null);
  const [improvePayload,   setImprovePayload]   = useState(null);
  const [booting,          setBooting]          = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); setPage("dashboard"); }
      setBooting(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); setPage("dashboard"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (u) => { setUser(u); setPage("dashboard"); };

  const handleLogout = async () => {
    if (user && !user.isDemo) await supabase.auth.signOut();
    setUser(null); setPage("login");
  };

  if (booting) return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid #e2e8f0", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 12px" }}/>
        <div style={{ fontSize:13, color:"#64748b", fontWeight:500 }}>Loading APAS...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (page === "login")
    return <Login onLogin={handleLogin} />;

  if (page === "analysis")
    return (
      <AnalysisPage
        payload={analyzePayload}
        user={user}
        onBack={() => setPage("dashboard")}
        onImprove={(payload) => { setImprovePayload(payload); setPage("improvements"); }}
      />
    );

  if (page === "improvements")
    return (
      <ImprovementsPage
        payload={improvePayload}
        user={user}
        onBack={() => setPage("analysis")}
      />
    );

  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onAnalyze={(payload) => { setAnalyzePayload(payload); setPage("analysis"); }}
    />
  );
}