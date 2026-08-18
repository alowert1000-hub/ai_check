import { pick, sample, shuffle } from "@/src/utils/random";

export type Person = { name: string; emoji: string };
export const PEOPLE: Person[] = [
  { name: "영희", emoji: "🐰" },
  { name: "수현", emoji: "🐻" },
  { name: "지훈", emoji: "🦊" },
];

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const FOODS = ["돈까스", "피자", "김밥", "순대", "파스타", "초밥", "라면", "치킨", "쌀국수"];
export const MAP_CELLS = 16;

export type AppointmentKind = "day" | "map" | "menu" | "bus";

export type Reveal = {
  person: Person;
  picks: string[];
};

export type AppointmentRound = {
  kind: AppointmentKind;
  title: string;
  prompt: string;
  reveals: Reveal[];
  choices: string[];
  answer: string;
  late: boolean;
};

function intersect(lists: string[][]): string[] {
  return lists[0].filter((x) => lists.every((l) => l.includes(x)));
}

function makeIntersectRound(
  kind: AppointmentKind,
  title: string,
  prompt: string,
  pool: string[],
  pickCount: number,
  late: boolean
): AppointmentRound {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const answer = pick(pool);
    const lists = PEOPLE.map(() =>
      shuffle([answer, ...sample(pool.filter((x) => x !== answer), pickCount - 1)])
    );
    const inter = intersect(lists);
    if (inter.length !== 1 || inter[0] !== answer) continue;
    const decoys = sample(pool.filter((x) => x !== answer), Math.min(4, pool.length - 1));
    return {
      kind,
      title,
      prompt,
      reveals: PEOPLE.map((person, i) => ({ person, picks: lists[i] })),
      choices: kind === "map" ? [] : shuffle([answer, ...decoys]),
      answer,
      late,
    };
  }
  const answer = pool[0];
  return {
    kind,
    title,
    prompt,
    reveals: PEOPLE.map((person) => ({ person, picks: pool.slice(0, pickCount) })),
    choices: kind === "map" ? [] : shuffle(pool.slice(0, 5)),
    answer,
    late,
  };
}

function makeBusRound(): AppointmentRound {
  const numbers = shuffle(
    Array.from(
      new Set(Array.from({ length: 20 }, () => String(1 + Math.floor(Math.random() * 90))))
    )
  ).slice(0, 8);
  const answer = numbers[0];
  const shown = numbers.slice(1, 7);
  const chunks: string[][] = [[], [], []];
  shown.forEach((b, i) => chunks[i % 3].push(b));
  return {
    kind: "bus",
    title: "아무도 탑승하지 않은 버스",
    prompt: "아무도 탑승하지 않은 버스 번호를 고르세요",
    reveals: PEOPLE.map((person, i) => ({ person, picks: chunks[i] })),
    choices: shuffle([answer, ...sample(shown, 4)]),
    answer,
    late: false,
  };
}

export function makeAppointmentSet(): AppointmentRound[] {
  const mapPool = Array.from({ length: MAP_CELLS }, (_, i) => String(i));
  return [
    makeIntersectRound("day", "공통 선호 요일", "세 사람이 공통으로 선호하는 요일을 고르세요", DAYS, 3, false),
    makeIntersectRound("day", "공통 선호 요일 (후반)", "세 사람이 공통으로 선호하는 요일을 고르세요", DAYS, 4, true),
    makeIntersectRound("map", "공통 선호 위치", "세 사람이 공통으로 선호하는 위치를 고르세요", mapPool, 3, false),
    makeIntersectRound("map", "공통 선호 위치 (후반)", "세 사람이 공통으로 선호하는 위치를 고르세요", mapPool, 4, true),
    makeIntersectRound("menu", "공통 선호 메뉴", "세 사람이 공통으로 선호하는 메뉴를 고르세요", FOODS, 3, false),
    makeIntersectRound("menu", "공통 선호 메뉴 (후반)", "세 사람이 공통으로 선호하는 메뉴를 고르세요", FOODS, 4, true),
    makeBusRound(),
  ];
}
