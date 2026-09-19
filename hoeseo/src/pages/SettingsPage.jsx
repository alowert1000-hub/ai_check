import { useEffect, useState } from "react";
import { Button, PhoneShell, TabBar } from "../components/ui.jsx";
import { keyStatus, testConnection } from "../lib/ai.js";
import { dateKey } from "../lib/dates.js";
import {
  clearDemoRecords,
  getApiKey,
  getReportEmail,
  saveReportEmailRemote,
  sendDayReport,
  sendTestEmail,
  setApiKey,
  setReportEmail,
} from "../lib/store.js";

export function SettingsPage() {
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [email, setEmail] = useState(() => getReportEmail());
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({ serverKey: false, clientKey: !!getApiKey() });
  const [testing, setTesting] = useState(false);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    keyStatus()
      .then(setStatus)
      .catch(() => {});
  }, []);

  const connected = status.serverKey || status.clientKey || !!apiKey.trim();

  return (
    <PhoneShell>
      <main className="flex-1 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-6">
        <p className="text-[14px] font-semibold text-toss-blue">설정</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.7px] text-toss-text">앱을 내 환경에 맞게</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-toss-600">
          OpenAI 키가 있어야 질문과 모범 답안이 매번 달라집니다. 키가 없으면 같은 체험 템플릿이 반복됩니다.
        </p>
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] font-bold text-toss-text">연결 상태</p>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${connected ? "bg-toss-blue-soft text-toss-blue" : "bg-[#FFF6E6] text-[#C27A00]"}`}>
              {connected ? "키 있음" : "미연결"}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-toss-500">
            {status.serverKey
              ? "서버(.env) 키가 감지되었습니다."
              : status.clientKey || apiKey
                ? "이 기기에 저장된 키로 연결합니다."
                : "아직 키가 없습니다. 아래에 sk-로 시작하는 키를 저장해 주세요."}
          </p>
        </section>
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <label htmlFor="apiKey" className="text-[14px] font-bold text-toss-text">
            OpenAI API 키
          </label>
          <p className="mt-1 text-[13px] leading-relaxed text-toss-500">
            이 기기에만 저장됩니다. 또는 프로젝트 `.env`에 `OPENAI_API_KEY=`를 넣고 개발 서버를 다시 켜 주세요.
          </p>
          <input
            id="apiKey"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKeyState(event.target.value)}
            placeholder="sk-..."
            className="mt-4 h-12 w-full rounded-2xl bg-toss-bg px-4 text-[15px] text-toss-text outline-none focus:ring-2 focus:ring-toss-blue/30"
          />
          <div className="mt-3 space-y-2">
            <Button
              size="md"
              onClick={() => {
                setApiKey(apiKey);
                setStatus((current) => ({ ...current, clientKey: !!apiKey.trim() }));
                setMessage("API 키를 저장했어요. 연결 테스트로 확인해 보세요.");
              }}
            >
              키 저장
            </Button>
            <Button
              variant="secondary"
              size="md"
              disabled={testing}
              onClick={async () => {
                setTesting(true);
                setMessage("");
                try {
                  setApiKey(apiKey);
                  const result = await testConnection();
                  setMessage(
                    result?.ok === false
                      ? "응답은 왔지만 형식이 예상과 다릅니다."
                      : "OpenAI 연결에 성공했어요. 이제 모범 답안이 매번 달라집니다.",
                  );
                } catch (error) {
                  setMessage(error.message || "연결에 실패했습니다.");
                } finally {
                  setTesting(false);
                }
              }}
            >
              {testing ? "연결 확인 중..." : "연결 테스트"}
            </Button>
          </div>
        </section>
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <label htmlFor="reportEmail" className="text-[14px] font-bold text-toss-text">
            하루 리포트 메일
          </label>
          <p className="mt-1 text-[13px] leading-relaxed text-toss-500">
            당일 00:01부터 23:59까지 한 연습을 다음 날 00:01에 요약해서 보냅니다. 연습이 없는 날은 보내지 않습니다. 첫 연결 때 확인 메일이 오면 받은편지함에서 승인해 주세요.
          </p>
          <input
            id="reportEmail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-4 h-12 w-full rounded-2xl bg-toss-bg px-4 text-[15px] text-toss-text outline-none focus:ring-2 focus:ring-toss-blue/30"
          />
          <div className="mt-3 space-y-2">
            <Button
              size="md"
              disabled={!!busy}
              onClick={async () => {
                setBusy("save");
                setMessage("");
                try {
                  setReportEmail(email);
                  await saveReportEmailRemote(email);
                  const result = await sendTestEmail(email);
                  setMessage(
                    result.needsConfirmation
                      ? "확인 메일을 보냈어요. 받은편지함에서 승인한 뒤부터 매일 리포트가 옵니다."
                      : "리포트 받을 이메일을 저장하고 테스트 메일을 보냈어요.",
                  );
                } catch (error) {
                  setMessage(error.message || "이메일 저장에 실패했습니다.");
                } finally {
                  setBusy("");
                }
              }}
            >
              {busy === "save" ? "저장 중..." : "이메일 저장 후 테스트 보내기"}
            </Button>
            <Button
              variant="secondary"
              size="md"
              disabled={!!busy}
              onClick={async () => {
                setBusy("today");
                setMessage("");
                try {
                  setReportEmail(email);
                  const result = await sendDayReport(dateKey(), { email, markSent: false });
                  setMessage(result.skipped ? "오늘 연습 기록이 없어 메일을 보내지 않았어요." : "오늘 지금까지의 리포트를 메일로 보냈어요.");
                } catch (error) {
                  setMessage(error.message || "오늘 리포트 발송에 실패했습니다.");
                } finally {
                  setBusy("");
                }
              }}
            >
              {busy === "today" ? "보내는 중..." : "오늘 리포트 지금 보내기"}
            </Button>
          </div>
        </section>
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <p className="text-[14px] font-bold text-toss-text">홈 화면에 추가 (iOS)</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-toss-600">
            <li>Safari로 이 페이지를 엽니다.</li>
            <li>하단 공유 버튼을 누릅니다.</li>
            <li>홈 화면에 추가를 선택합니다.</li>
          </ol>
        </section>
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <p className="text-[14px] font-bold text-toss-text">예시 기록</p>
          <p className="mt-1 text-[13px] text-toss-500">처음 앱을 열면 캘린더에 예시 기록이 보여요.</p>
          <div className="mt-3">
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                clearDemoRecords();
                setMessage("예시 기록을 삭제했어요.");
              }}
            >
              예시 기록 삭제
            </Button>
          </div>
        </section>
        {message && <p className="mt-4 text-[13px] font-semibold leading-relaxed text-toss-blue">{message}</p>}
      </main>
      <TabBar />
    </PhoneShell>
  );
}
