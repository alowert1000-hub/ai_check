# 모의면접 (hoeseo)

[hoeseo.vercel.app](https://hoeseo.vercel.app)에 올라가 있던 자소서 기반 AI 모의면접 앱을 이 저장소로 가져왔습니다.

기아 생산 엔지니어 자소서·질문 은행 80문항, 음성 답변, 모범 답안 비교, 하루 리포트까지 라이브 앱과 같은 흐름입니다.

## 실행

```bash
cd hoeseo
npm install
cp .env.example .env   # 필요하면 OPENAI_API_KEY 입력
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다.

## 배포

Vercel 프로젝트 루트를 `hoeseo`로 지정하거나, 이 폴더에서 `vercel`로 배포하면 됩니다.

```
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...          # 리포트 메일 (선택)
REPORT_FROM_EMAIL=모의면접 <noreply@your-domain>
```

설정 화면에서 기기별 OpenAI 키를 넣을 수도 있습니다. 키가 없으면 체험용 템플릿 채점이 돌아갑니다.

## 화면

| 경로 | 역할 |
| --- | --- |
| `/` | 홈, 캘린더, 오늘 연습 기록 |
| `/resume` | 자기소개서 |
| `/mastery` | 꼭 외울 문장·키워드·흐름 |
| `/interview` | 음성/텍스트 답변 |
| `/feedback` | 점수, 모범 답안, 문장 다듬기 |
| `/report` | 하루 리포트 |
| `/settings` | API 키, 메일, PWA 안내 |
| `/bank` | 질문 은행 80문항 목록 |
| `/bank/:id` | 준비된 답변, AI 2줄 요약, 주요 키워드 |
