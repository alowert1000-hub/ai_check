# 역검연습 — AI 역량검사 전략게임 9종

잡다(JOBDA) 신역검 전략게임을 **아이폰·아이패드**에서 반복 연습하는 Expo 앱입니다.
9개 게임 모두 시작할 때마다 문제가 랜덤 생성되며, 세트 종료 후 AI로 맞춤 피드백을 받을 수 있습니다.

공식 시험 복제가 아니라 **규칙·속도·작업기억**을 익히기 위한 연습 도구입니다.

## 아이폰 / 아이패드에 앱으로 설치

스토어 **Expo Go는 SDK 57을 아직 열지 못합니다.** 그래서 이 프로젝트는 사파리에서 **홈 화면에 추가**하면 일반 앱처럼 쓰는 방식(PWA)으로 맞춰 두었습니다. Apple 개발자 계정($99) 없이 아이폰·아이패드 둘 다 바로 설치할 수 있습니다.

배포 주소:

**https://alowert1000-hub.github.io/ai_check/**

### 설치 순서

1. GitHub 저장소가 **Private**이면 Pages가 안 열립니다. [저장소 Settings → General → Danger Zone → Change visibility](https://github.com/alowert1000-hub/ai_check/settings)에서 잠깐 **Public**으로 바꾸세요. API 키는 저장소에 없습니다.
2. [Settings → Pages](https://github.com/alowert1000-hub/ai_check/settings/pages)에서 Source를 **Deploy from a branch**, Branch를 **gh-pages** / **/ (root)** 로 저장합니다.
3. `main`에 푸시되면 GitHub Actions가 웹 앱을 빌드해 `gh-pages`에 올립니다. Actions 탭에서 초록색이면 성공입니다.
4. 아이폰/아이패드에서 **Safari**(Chrome 아님)로 위 주소를 엽니다.
5. 공유 버튼(네모 + 화살표) → **홈 화면에 추가** → 추가.
6. 홈 화면의 **역검연습** 아이콘을 누르면 전체 화면 앱으로 실행됩니다.

아이패드는 홈이 3열, 아이폰은 2열로 맞춰집니다. 가로/세로 모두 됩니다.

## PC에서 미리보기

```bash
npm install
npx expo start --web
```

브라우저에서 레이아웃을 확인할 수 있습니다. 아이폰/아이패드 실사용은 위의 홈 화면 설치가 맞습니다.

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
git clone https://github.com/alowert1000-hub/ai_check.git
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

`main`에 푸시하면 아이폰/아이패드용 웹 앱도 같이 다시 배포됩니다.

## 기술 스택

React Native · Expo Router · NativeWind · Zustand · Reanimated · OpenAI API
