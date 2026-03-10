import { useState } from "react";

export default function AIChat({ projectContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          projectContext
        })
      });

      const data = await res.json();

      const aiMsg = { role: "assistant", content: data.reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Error contacting AI."
      }]);
    }

    setInput("");
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 30, padding: 20, border: "1px solid #ddd", borderRadius: 10 }}>
      <h3>APAS AI Assistant</h3>

      <div style={{ height: 300, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            textAlign: msg.role === "user" ? "right" : "left",
            marginBottom: 8
          }}>
            <span style={{
              display: "inline-block",
              padding: 10,
              borderRadius: 8,
              background: msg.role === "user" ? "#3b82f6" : "#f1f5f9",
              color: msg.role === "user" ? "#fff" : "#000",
              maxWidth: "70%"
            }}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <div>Thinking...</div>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your project..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}