import { RDB_KNOWLEDGE } from "./_knowledge.js";

const TOKEN = process.env.HF_TOKEN;
const MODEL = "Qwen/Qwen2.5-7B-Instruct:featherless-ai";
const ALLOWED_ORIGIN = "https://prajithkulli1.github.io";

function relevant(query) {
  const terms = query.toLowerCase().split(/\W+/).filter((word) => word.length > 2);
  return RDB_KNOWLEDGE.split(/\n\s*\n/).sort((a, b) => terms.filter((w) => b.toLowerCase().includes(w)).length - terms.filter((w) => a.toLowerCase().includes(w)).length).slice(0, 4).join("\n\n");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const message = (req.body?.message || "").trim();
  if (!message) return res.status(400).json({ error: "Please enter a question." });
  if (!TOKEN) return res.status(500).json({ error: "The assistant is not configured." });
  try {
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 350, temperature: 0.2, messages: [
        { role: "system", content: `You are the helpful studio assistant for Rebecca Duffy Bush Artwork. Answer only from this original-website knowledge. Never invent facts. If the answer is not present, say you do not have that detail and suggest contacting River to Sea Gallery. Keep answers concise.\n\n${relevant(message)}` },
        { role: "user", content: message }
      ] })
    });
    if (!response.ok) throw new Error("Hugging Face request failed");
    const data = await response.json();
    return res.status(200).json({ answer: data.choices?.[0]?.message?.content || "I couldn’t find an answer." });
  } catch {
    return res.status(500).json({ error: "The assistant could not answer right now." });
  }
}
