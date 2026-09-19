export function HomeIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={active ? "#3182F6" : "#8B95A1"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReportIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" />
      <path d="M8 9h8M8 13h8M8 17h5" stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.2" stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3V20.5M20.5 12h-2.2M5.7 12H3.5M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6M17.9 17.9l-1.6-1.6M7.7 7.7 6.1 6.1"
        stroke={active ? "#3182F6" : "#8B95A1"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BankIcon({ active }) {
  const color = active ? "#3182F6" : "#8B95A1";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="6.2" cy="7" r="1.35" fill={color} />
      <circle cx="6.2" cy="12" r="1.35" fill={color} />
      <circle cx="6.2" cy="17" r="1.35" fill={color} />
      <path d="M10 7h8.2M10 12h8.2M10 17h5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MasteryIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16.5H7.8A2.8 2.8 0 0 0 5 22.3V5.5Z"
        stroke={active ? "#3182F6" : "#8B95A1"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 7h8M8 11h6" stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3.5" width="6" height="10" rx="3" fill="white" />
      <path d="M6.5 11a5.5 5.5 0 0 0 11 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16.5V20M8.5 20h7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function StopIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="7" y="7" width="10" height="10" rx="2.2" fill="white" />
    </svg>
  );
}

export function Chevron({ dir = "left" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d={dir === "left" ? "M14.5 6 8.5 12l6 6" : "M9.5 6l6 6-6 6"}
        stroke="#191F28"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 5 8 12l7 7" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SpeakerIcon({ speaking }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 9.5v5h3.2L12 18.5v-13L7.2 9.5H4Z" fill="#3182F6" />
      <path
        d="M16 9.2a4 4 0 0 1 0 5.6M18.5 7a7 7 0 0 1 0 10"
        stroke="#3182F6"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={speaking ? 1 : 0.45}
      />
    </svg>
  );
}
