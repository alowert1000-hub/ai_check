# 역검연습 — AI 역량검사 전략게임 9종

잡다(JOBDA) 신역검 전략게임을 **아이패드/태블릿**에서 반복 연습하는 Expo 앱입니다.
9개 게임 모두 시작할 때마다 문제가 랜덤 생성되며, 세트 종료 후 OpenAI로 맞춤 피드백을 받을 수 있습니다.

공식 시험 복제가 아니라 **규칙·속도·작업기억**을 익히기 위한 연습 도구입니다.

## 실행 방법

```bash
npm install
npx expo start
```

아이패드에서는 **Expo Go**로 QR을 스캔하면 바로 연습할 수 있습니다. 가로/세로 모두 지원합니다.

## OpenAI 피드백

1. 앱 홈 오른쪽 ⚙️ **AI 코치 설정**
2. OpenAI API Key 저장 (`gpt-4o-mini` 권장)
3. 게임 1세트 종료 시 정답률·반응속도·오답 패턴을 보내 3줄 팁을 생성합니다.

키가 없어도 로컬 코치 팁이 표시됩니다. 환경 변수로도 넣을 수 있습니다.

```
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o-mini
```

## 9가지 게임

| 게임 | 연습 포인트 |
| --- | --- |
| 가위바위보 | 이기/지기/비기기 + 나/상대 시점 전환 |
| 도형 회전하기 | 45° 회전 + 상하/좌우 반전 |
| 약속 정하기 | 교집합 소거, 버스는 미등장 번호 |
| 길 만들기 | `/` `\` 거울로 빛을 택시까지 |
| 마법약 만들기 | 숨은 조합(확률) 추론 |
| 숫자 누르기 | 점등 반응 + 두 번/건너뛰기 조건 |
| 도형 순서 기억하기 | 2-back → 2/3-back 혼합 |
| 고양이 술래잡기 | 위치 기억 + 확신도(메타인지) |
| 개수 비교하기 | 단어/점 개수 순간 비교 |

## 다른 컴퓨터에서 이어서 작업하기

```bash
git clone <저장소 URL>
cd ai_check
npm install
cp .env.example .env   # Windows PowerShell: copy .env.example .env
npx expo start
```

`node_modules/`, `.expo/`, `.env`는 커밋되지 않으므로 새 PC에서는 `npm install`을 먼저 실행해야 합니다.
API 키는 저장소에 올라가지 않으니 새 PC에서는 앱의 ⚙️ 설정 화면이나 `.env`에 다시 넣어 주세요.

작업을 마칠 때마다 아래로 백업합니다.

```bash
git add -A
git commit -m "작업 내용"
git push
```

## 기술 스택

React Native · Expo Router · NativeWind · Zustand · Reanimated · OpenAI API
