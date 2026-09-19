import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chevron } from "../components/icons.jsx";
import { PhoneShell, TabBar } from "../components/ui.jsx";
import { CATEGORY_META, QUESTION_BANK, categoryShort, groupedQuestionBank, questionSummary } from "../data/questions.js";

function matchesQuery(item, query) {
  if (!query) return true;
  const haystack = [item.question, item.answer, questionSummary(item), ...(item.keywords || [])].join(" ").toLowerCase();
  return haystack.includes(query);
}

export function BankPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const normalized = query.trim().toLowerCase();

  const groups = useMemo(() => {
    return groupedQuestionBank()
      .filter((group) => category === "all" || group.key === category)
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => matchesQuery(item, normalized)),
      }))
      .filter((group) => group.items.length);
  }, [category, normalized]);

  const shown = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <PhoneShell>
      <main className="flex-1 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-6">
        <p className="text-[14px] font-semibold text-toss-blue">문제은행</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.7px] text-toss-text">
          80문항 답변을
          <br />
          하나씩 확인하세요
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-toss-600">
          질문을 누르면 준비된 답변과 AI 2줄 요약, 주요 키워드가 함께 나옵니다.
        </p>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="질문, 키워드, 답변 검색"
          aria-label="질문 검색"
          className="mt-5 h-12 w-full rounded-2xl bg-white px-4 text-[15px] text-toss-text shadow-[0_8px_24px_rgba(25,31,40,0.05)] outline-none placeholder:text-toss-400"
        />

        <div className="-mx-5 mt-4 overflow-x-auto px-5">
          <div className="flex w-max gap-1.5">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${
                category === "all" ? "bg-toss-blue text-white" : "bg-white text-toss-600"
              }`}
            >
              전체 {QUESTION_BANK.length}
            </button>
            {CATEGORY_META.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setCategory(item.key)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${
                  category === item.key ? "bg-toss-blue text-white" : "bg-white text-toss-600"
                }`}
              >
                {item.short}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[13px] font-semibold text-toss-500">{shown}개 질문</p>

        {groups.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-white px-5 py-10 text-center shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
            <p className="text-[16px] font-bold text-toss-text">검색 결과가 없어요</p>
            <p className="mt-1 text-[14px] text-toss-500">다른 단어로 다시 찾아 보세요.</p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="mt-4">
              <div className="mb-2 flex items-end justify-between px-1">
                <h2 className="text-[15px] font-extrabold tracking-[-0.3px] text-toss-text">{group.short}</h2>
                <span className="text-[12px] font-semibold text-toss-500">{group.items.length}문항</span>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const number = item.id.replace("q-", "");
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/bank/${item.id}`)}
                      className="flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-[0_8px_24px_rgba(25,31,40,0.05)] transition-transform active:scale-[0.99]"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-toss-blue-soft text-[12px] font-extrabold text-toss-blue">
                        {number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-toss-500">{categoryShort(item.category)}</p>
                        <p className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.2px] text-toss-text">
                          {item.question}
                        </p>
                      </div>
                      <span className="mt-1 shrink-0 text-toss-400">
                        <Chevron dir="right" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
      <TabBar />
    </PhoneShell>
  );
}
