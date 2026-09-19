import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, PhoneShell, TabBar } from "../components/ui.jsx";
import { DEFAULT_RESUME } from "../data/resume.js";
import { getResume, saveResume } from "../lib/store.js";

export function ResumePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = getResume();
  const [content, setContent] = useState(current?.content || DEFAULT_RESUME);
  const [updatedAt, setUpdatedAt] = useState(current?.updatedAt || "");
  const [message, setMessage] = useState("");

  const persist = () => {
    if (content.trim().length < 20) {
      setMessage("자기소개서를 20자 이상 입력해 주세요.");
      return false;
    }
    const saved = saveResume(content);
    setUpdatedAt(saved.updatedAt);
    setMessage("자소서를 저장했어요.");
    return true;
  };

  return (
    <PhoneShell>
      <main className="flex-1 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-6">
        <p className="text-[14px] font-semibold text-toss-blue">자기소개서</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.7px] text-toss-text">
          나를 보여주는 글을
          <br />
          먼저 남겨 주세요
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-toss-600">기아 자소서 세 문항이 기본입니다. 꼬리질문은 이 글에 적힌 경험만 찌릅니다.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!persist()) return;
            navigate(location.state?.next || "/mastery");
          }}
          className="mt-6"
        >
          <label htmlFor="resume" className="mb-2 block text-[13px] font-semibold text-toss-600">
            자기소개서
          </label>
          <textarea
            id="resume"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setMessage("");
            }}
            placeholder="기아 자소서 세 문항을 그대로 붙여 넣으세요."
            className="h-[320px] w-full resize-none rounded-2xl bg-white p-4 leading-relaxed text-toss-text shadow-[0_8px_24px_rgba(25,31,40,0.05)] outline-none placeholder:text-toss-400 focus:ring-2 focus:ring-toss-blue/30"
          />
          <div className="mt-2 flex items-center justify-between text-[12px] text-toss-500">
            <span>{content.trim().length}자</span>
            {updatedAt && <span>최근 저장 {new Date(updatedAt).toLocaleString("ko-KR")}</span>}
          </div>
          {message && <p className="mt-3 text-[13px] font-semibold text-toss-blue">{message}</p>}
          <p className="mt-4 text-[13px] leading-relaxed text-toss-500">저장하면 숙지 칸에 꼭 외울 문장, 단어, 전체 흐름이 다시 정리됩니다.</p>
          <div className="mt-5 space-y-3">
            <Button type="submit">저장하고 계속</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setContent(DEFAULT_RESUME);
                setMessage("기본 기아 자소서를 넣었어요.");
              }}
            >
              기본 자소서 불러오기
            </Button>
          </div>
        </form>
      </main>
      <TabBar />
    </PhoneShell>
  );
}
