import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { supabase } from "./supabaseClient";

const DEMO_EMAIL = "demonslayer@gmail.com";
const DEMO_PASS  = "Tanjiro@1290";

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 008 10.95c.6.1.82-.26.82-.58v-2.03c-3.25.7-3.93-1.57-3.93-1.57-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.8 1.2 1.8 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.73-1.56-2.6-.3-5.34-1.3-5.34-5.8 0-1.28.46-2.33 1.2-3.15-.12-.3-.52-1.5.12-3.13 0 0 .98-.31 3.2 1.2a11.1 11.1 0 015.82 0c2.22-1.51 3.2-1.2 3.2-1.2.64 1.63.24 2.83.12 3.13.75.82 1.2 1.87 1.2 3.15 0 4.52-2.75 5.5-5.37 5.79.41.36.78 1.08.78 2.18v3.23c0 .32.22.69.83.57A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z"/>
  </svg>
);

export const DEMO_USER = {
  id: "demo-user-tanjiro",
  email: DEMO_EMAIL,
  user_metadata: { full_name: "Tanjiro" },
  isDemo: true,
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    if (email === DEMO_EMAIL && password === DEMO_PASS) {
      await new Promise(r => setTimeout(r, 600));
      setLoading(false);
      onLogin(DEMO_USER);
      return;
    }

    try {
      const { data, error: err } =
        await supabase.auth.signInWithPassword({ email, password });

      if (err) throw err;

      onLogin(data.user);
    } catch {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => onLogin(DEMO_USER);
  const handleGithub = () => onLogin(DEMO_USER);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>

        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)"
        }}>

          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
            Welcome to AI Project Analyzer System
          </h1>

          {error && (
            <div style={{
              background: "#fee2e2",
              padding: 10,
              borderRadius: 8,
              fontSize: 13,
              color: "#b91c1c",
              marginBottom: 16
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14, position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
              <input
                type="email"
                placeholder={DEMO_EMAIL}
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 35px",
                  borderRadius: 9,
                  border: "1px solid #bfdbfe"
                }}
                required
              />
            </div>

            <div style={{ marginBottom: 10, position: "relative" }}>
              <Lock size={14} style={{ position: "absolute", left: 12, top: 12, color: "#64748b" }} />
              <input
                type={showPass ? "text" : "password"}
                placeholder={DEMO_PASS}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 35px",
                  borderRadius: 9,
                  border: "1px solid #bfdbfe"
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 11,
                  top: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>

            {/* Remember + Forgot */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
              fontSize: 13
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                />
                Remember Me
              </label>

              <span style={{
                color: "#2563eb",
                cursor: "pointer"
              }}>
                Forgot Password?
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 9,
                background: "#16a34a",
                color: "#fff",
                border: "none",
                fontWeight: 700
              }}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "20px 0",
            fontSize: 11
          }}>
            <div style={{ flex: 1, height: 1, background: "#e8edf2" }} />
            OR CONTINUE WITH
            <div style={{ flex: 1, height: 1, background: "#e8edf2" }} />
          </div>

          {/* Social stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleGoogle}
              style={{ padding: 11, borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff" }}>
              <GoogleIcon/> Continue with Google
            </button>

            <button onClick={handleGithub}
              style={{ padding: 11, borderRadius: 9, border: "none", background: "#0f172a", color: "#fff" }}>
              <GithubIcon/> Continue with GitHub
            </button>
          </div>

          {/* Professional Info Section */}
          <div style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: 13,
            color: "#475569"
          }}>
            <strong>Your Project, Analyzed Professionally</strong>
            <div style={{ marginTop: 6 }}>
              We analyze your project structure, code quality, architecture,
              and readiness level. Your information is encrypted and protected.
            </div>
          </div>

          {/* Security Bar */}
          <div style={{
            marginTop: 16,
            padding: 10,
            borderRadius: 10,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            fontSize: 12,
            fontWeight: 600,
            color: "#15803d",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6
          }}>
            <Shield size={13}/> Secured by Supabase Authentication
          </div>

        </div>

        <div style={{
          textAlign: "center",
          marginTop: 14,
          fontSize: 11,
          color: "#94a3b8"
        }}>
          © 2026 AI Project Analyzer System
        </div>
      </div>
    </div>
  );
}