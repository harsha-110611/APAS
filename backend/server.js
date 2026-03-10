import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
console.log("Loaded KEY:", process.env.GROQ_API_KEY);
const app = express();

app.use(cors());
app.use(express.json());

/* ─────────────────────────────────────────────
   Health Check Route
───────────────────────────────────────────── */
app.get("/", (req, res) => {
  res.send("AI Backend Running");
});

/* ─────────────────────────────────────────────
   AI Chat Route
───────────────────────────────────────────── */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, projectContext } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY not found in .env file"
      });
    }

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `
You are APAS AI.
You help developers improve their projects.

Project Context:
Overall Score: ${projectContext?.overallScore ?? "N/A"}
Security Score: ${projectContext?.securityScore ?? "N/A"}
Files Count: ${projectContext?.filesCount ?? "N/A"}

Be precise. Provide clean code when needed.
`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Groq Error:", data);
      return res.status(500).json({
        error: data?.error?.message || "Groq API error"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response received from AI.";

    res.json({ reply });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      error: "AI request failed"
    });
  }
});

/* ─────────────────────────────────────────────
   Start Server
───────────────────────────────────────────── */
const PORT = 5001;

app.listen(PORT, () => {
  console.log(`AI Server running on http://localhost:${PORT}`);
});