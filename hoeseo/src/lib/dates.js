export function dateKey(value = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function formatKoreanDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(year, month - 1, day).getDay()];
  return `${month}월 ${day}일 ${weekday}요일`;
}

export function formatKoreanTime(value) {
  const date = typeof value === "string" ? new Date(value) : value;
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours < 12 ? "오전" : "오후"} ${hours % 12 || 12}:${minutes}`;
}

export function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
