const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function briefingHtml(briefing, { test = false } = {}) {
  if (test) {
    return `
      <p>모의면접 리포트 메일이 연결되었습니다.</p>
      <p>연습이 있는 날의 다음 날 00:01에 하루 요약이 이 주소로 옵니다.</p>
    `;
  }
  const sessions = (briefing?.sessions || [])
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.trackLabel || "기본 질문")} · ${item.score}점</strong><br/>${escapeHtml(item.question)}<br/>${escapeHtml(item.content || "")}</li>`,
    )
    .join("");
  return `
    <h2>${escapeHtml(briefing?.dateKey || "")} 모의면접 리포트</h2>
    <p>연습 ${briefing?.count || 0}회 · 평균 ${briefing?.avgScore || 0}점 · 최고 ${briefing?.bestScore || 0}점</p>
    <h3>오늘 집중할 점</h3>
    <ul>${(briefing?.focus || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <h3>세션</h3>
    <ul>${sessions}</ul>
  `;
}

async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL || "모의면접 <noreply@example.com>";
  if (!key) {
    throw new Error("메일 서버 키가 없습니다. Vercel에 RESEND_API_KEY를 넣어 주세요.");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "메일 요청에 실패했습니다.");
  }
  return data;
}

export async function handleReportEmail(req, res) {
  if (req.method === "GET") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    return res.status(200).json({ ok: true, already: true, dateKey });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const email = String(body.email || "").trim();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "이메일 주소가 올바르지 않습니다." });
  }

  if (body.action === "settings") {
    return res.status(200).json({ ok: true });
  }

  if (body.action === "sync") {
    return res.status(200).json({ ok: true, synced: true });
  }

  if (body.action === "send") {
    try {
      await sendEmail({
        to: email,
        subject: body.test ? "모의면접 메일 연결 확인" : `${body.dateKey || "오늘"} 모의면접 리포트`,
        html: briefingHtml(body.briefing, { test: !!body.test }),
      });
      return res.status(200).json({ ok: true, already: false });
    } catch (error) {
      return res.status(400).json({ error: error.message || "메일 요청에 실패했습니다." });
    }
  }

  return res.status(400).json({ error: "지원하지 않는 요청입니다." });
}

export default handleReportEmail;
