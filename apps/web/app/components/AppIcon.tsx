import type { SVGProps } from "react";

export type AppIconName =
  | "agenda"
  | "arrow"
  | "bell"
  | "cash"
  | "chat"
  | "check"
  | "clients"
  | "coach"
  | "dashboard"
  | "logout"
  | "marketing"
  | "menu"
  | "package"
  | "plus"
  | "search"
  | "settings"
  | "sparkle"
  | "team"
  | "trend"
  | "wheel"
  | "x";

type AppIconProps = SVGProps<SVGSVGElement> & {
  name: AppIconName;
  size?: number;
};

export default function AppIcon({ name, size = 20, ...props }: AppIconProps) {
  const paths: Record<AppIconName, React.ReactNode> = {
    agenda: <><path d="M7 3v3M17 3v3M4 9h16"/><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 13h3M8 17h5M15 13h1"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    cash: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h4M7 13h2M15 14h2M16 9v6"/></>,
    chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clients: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    coach: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/><path d="M2 19h22"/></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4"/></>,
    marketing: <><path d="m3 11 18-5v12L3 13z"/><path d="M11 15v5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    package: <><path d="m4 7 8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21h-4v-.09A1.7 1.7 0 0 0 8.55 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.2 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H2.5v-4h.09A1.7 1.7 0 0 0 4.2 8.55a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.55 4.2a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V2.5h4v.09A1.7 1.7 0 0 0 15 4.2a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.55a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1 .4h.09v4H21a1.7 1.7 0 0 0-1.6 1.05z"/></>,
    sparkle: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7zM5 14l.6 1.9 1.9.6-1.9.6L5 19l-.6-1.9-1.9-.6 1.9-.6z"/></>,
    team: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M19 8h3M20.5 6.5v3"/></>,
    trend: <><path d="M3 17 9 11l4 4 8-9"/><path d="M16 6h5v5"/></>,
    wheel: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="m12 3 2 7M21 12l-7 2M12 21l-2-7M3 12l7-2"/></>,
    x: <path d="m6 6 12 12M18 6 6 18"/>,
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}
