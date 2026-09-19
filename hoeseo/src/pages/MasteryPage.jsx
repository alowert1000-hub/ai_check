import { useNavigate } from "react-router-dom";
import { Button, PhoneShell, TabBar } from "../components/ui.jsx";
import { getMastery, getResume } from "../lib/store.js";

export function MasteryPage() {
  const navigate = useNavigate();
  const resume = getResume();
  const mastery = getMastery();

  if (!resume?.content || !mastery) {
    return (
      <PhoneShell>
        <main className="flex-1 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-6">
          <p className="text-[14px] font-semibold text-toss-blue">자기소개서 숙지</p>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.7px] text-toss-text">
            외워야 할 내용을
            <br />
            먼저 남겨 주세요
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-toss-600">자소서를 저장하면 꼭 알아야 할 문장, 단어, 전체 흐름이 여기에 정리됩니다.</p>
          <div className="mt-8">
            <Button onClick={() => navigate("/resume")}>자기소개서 작성하기</Button>
          </div>
        </main>
        <TabBar />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <main className="flex-1 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-6">
        <p className="text-[14px] font-semibold text-toss-blue">자기소개서 숙지</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.7px] text-toss-text">
          면접 전에
          <br />
          이 문장만 외우세요
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-toss-600">기아 자소서 세 문항에서 꼭 외울 장면, 단어, 흐름만 정리했습니다.</p>
        <section className="mt-5 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <p className="text-[13px] font-bold text-toss-500">꼭 알고 있어야 하는 내용</p>
          <ul className="mt-3 space-y-2">
            {mastery.mustKnow.map((item) => (
              <li key={item} className="rounded-2xl bg-toss-blue-soft px-3 py-2 text-[14px] font-semibold leading-relaxed text-toss-text">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <p className="text-[13px] font-bold text-toss-500">꼭 기억할 단어</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {mastery.keywords.map((word) => (
              <span key={word} className="rounded-full bg-toss-bg px-3 py-1.5 text-[13px] font-bold text-toss-text">
                {word}
              </span>
            ))}
          </div>
        </section>
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          <p className="text-[13px] font-bold text-toss-500">자소서 전체 흐름</p>
          <ol className="mt-3 space-y-3">
            {mastery.flow.map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-toss-blue text-[11px] font-bold text-white">
                  {item.step}
                </span>
                <p className="text-[14px] leading-relaxed text-toss-700">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>
        <div className="mt-8 space-y-3">
          <Button onClick={() => navigate("/interview")}>이 내용으로 면접 연습</Button>
          <Button variant="secondary" onClick={() => navigate("/resume")}>
            자기소개서 수정
          </Button>
        </div>
      </main>
      <TabBar />
    </PhoneShell>
  );
}
