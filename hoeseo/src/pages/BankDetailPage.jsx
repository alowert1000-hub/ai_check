import { Navigate, useNavigate, useParams } from "react-router-dom";
import { BackButton, Button, PhoneShell, TabBar } from "../components/ui.jsx";
import { bankNeighbors, categoryShort, questionSummary } from "../data/questions.js";

export function BankDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { item, index, prev, next, total } = bankNeighbors(id);

  if (!item) return <Navigate to="/bank" replace />;

  const summary = questionSummary(item);
  const keywords = item.keywords || [];

  return (
    <PhoneShell>
      <main className="flex-1 px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6">
        <div className="mb-4 flex items-center justify-between">
          <BackButton onClick={() => navigate("/bank")} />
          <span className="text-[13px] font-bold text-toss-500">
            {index + 1} / {total}
          </span>
          <span className="w-10" />
        </div>

        <p className="text-[13px] font-bold text-toss-blue">{categoryShort(item.category)}</p>
        <h1 className="mt-1 text-[22px] font-extrabold leading-snug tracking-[-0.5px] text-toss-text">{item.question}</h1>

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <p className="text-[12px] font-bold text-toss-blue">AI 2줄 요약</p>
          <p className="mt-2 whitespace-pre-wrap text-[16px] font-semibold leading-relaxed tracking-[-0.2px] text-toss-text">
            {summary}
          </p>
        </section>

        <section className="mt-3 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <p className="text-[12px] font-bold text-toss-500">주요 내용 키워드</p>
          {keywords.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {keywords.map((word) => (
                <span key={word} className="rounded-full bg-toss-blue-soft px-3 py-1.5 text-[13px] font-bold text-toss-blue">
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[14px] text-toss-500">이 문항의 키워드가 없습니다.</p>
          )}
        </section>

        <section className="mt-3 rounded-2xl bg-toss-blue p-5 shadow-[0_12px_28px_rgba(49,130,246,0.28)]">
          <p className="text-[12px] font-bold text-white/80">준비된 답변</p>
          <p className="mt-1 text-[16px] font-extrabold tracking-[-0.3px] text-white">면접장에서 이렇게 말해 보세요</p>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-white/95">{item.answer}</p>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={!prev} onClick={() => prev && navigate(`/bank/${prev.id}`)}>
            이전 질문
          </Button>
          <Button variant="secondary" disabled={!next} onClick={() => next && navigate(`/bank/${next.id}`)}>
            다음 질문
          </Button>
        </div>
      </main>
      <TabBar />
    </PhoneShell>
  );
}
