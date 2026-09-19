export async function handleChat(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const headerKey = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const key = headerKey || process.env.OPENAI_API_KEY || "";
  if (!key) {
    return res.status(401).json({ error: "OpenAI API 키가 필요합니다." });
  }

  const payload = req.body && !req.body.__raw ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: "요청 본문이 올바르지 않습니다." });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({ error: "OpenAI 응답을 읽지 못했습니다." }));
  return res.status(response.status).json(data);
}

export default handleChat;
