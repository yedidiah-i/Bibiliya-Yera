import type { SVGProps } from "react";

type Name =
  | "home"
  | "book"
  | "search"
  | "bookmark"
  | "note"
  | "plan"
  | "globe"
  | "settings"
  | "left"
  | "right"
  | "up"
  | "down"
  | "close"
  | "copy"
  | "highlight"
  | "link"
  | "download"
  | "trash"
  | "check"
  | "plus"
  | "sun"
  | "moon"
  | "menu"
  | "refresh"
  | "info"
  | "sparkle"
  | "list"
  | "chevron";

const PATHS: Record<Name, string> = {
  home: "M3 10.6 12 3.2l9 7.4V20a1.2 1.2 0 0 1-1.2 1.2H15v-6.4H9v6.4H4.2A1.2 1.2 0 0 1 3 20z",
  book: "M5 4.2A1.2 1.2 0 0 1 6.2 3H19v18H6.2A1.2 1.2 0 0 1 5 19.8zM9 3v18",
  search: "M10.8 3.5a7.3 7.3 0 1 0 0 14.6 7.3 7.3 0 0 0 0-14.6zM16.3 16.3 21 21",
  bookmark: "M6.5 3.8h11a.8.8 0 0 1 .8.8v16.2l-6.3-4.2-6.3 4.2V4.6a.8.8 0 0 1 .8-.8z",
  note: "M5 4.5h9.5L20 10v9.5H5zM14.2 4.8V10H19.6",
  plan: "M4 5.5h16M4 12h16M4 18.5h10",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.2 12h17.6M12 3c2.6 2.4 3.9 5.5 3.9 9s-1.3 6.6-3.9 9c-2.6-2.4-3.9-5.5-3.9-9S9.4 5.4 12 3z",
  settings:
    "M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zM19.4 13.6a7.6 7.6 0 0 0 0-3.2l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-2.8-1.6L13.8 2h-3.6l-.4 2.8a7.7 7.7 0 0 0-2.8 1.6l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3.2l-2 1.6 2 3.4 2.4-1a7.7 7.7 0 0 0 2.8 1.6l.4 2.8h3.6l.4-2.8a7.7 7.7 0 0 0 2.8-1.6l2.4 1 2-3.4z",
  left: "M14.5 5.5 8 12l6.5 6.5",
  right: "M9.5 5.5 16 12l-6.5 6.5",
  up: "M5.5 14.5 12 8l6.5 6.5",
  down: "M5.5 9.5 12 16l6.5-6.5",
  close: "M6 6l12 12M18 6L6 18",
  copy: "M9 9h9.5v11.5H9zM6.5 15H5.5V3.5h11V4.5",
  highlight: "M4 20h6M6.8 16.6 4.6 14.4 14 5l4.4 4.4-9.4 9.4-2.2-2.2zM14.6 4.4l2.2-2.2 4.4 4.4-2.2 2.2",
  link: "M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5",
  download: "M12 3.5v11M7.8 10.4 12 14.6l4.2-4.2M4 17.5v2.2h16v-2.2",
  trash: "M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5 7.5 21h9l1-14.5",
  check: "M4.5 12.8 9.6 18 19.5 6.5",
  plus: "M12 5v14M5 12h14",
  sun: "M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8zM12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6",
  moon: "M20 14.2A8.2 8.2 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2z",
  menu: "M4 6.5h16M4 12h16M4 17.5h16",
  refresh: "M20 12a8 8 0 1 1-2.6-5.9M20 4v4.2h-4.2",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 10.5V17M12 7.4v.4",
  sparkle: "M12 3.5l1.9 5.3 5.3 1.9-5.3 1.9L12 18l-1.9-5.4L4.8 10.7l5.3-1.9zM18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  list: "M4.5 6.5h4v4h-4zM11.5 7.5H20M4.5 14h4v4h-4zM11.5 15.5H20",
  chevron: "M6 9.5 12 15.5 18 9.5",
};

export function Icon({
  name,
  size = 18,
  ...rest
}: { name: Name; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
