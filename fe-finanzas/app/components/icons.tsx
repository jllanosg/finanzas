import type { ReactNode } from "react";

export type IconName =
  | "overview"
  | "transactions"
  | "budgets"
  | "goals"
  | "accounts"
  | "settings"
  | "help"
  | "search"
  | "bell"
  | "chevron"
  | "plus"
  | "arrow-up-right"
  | "arrow-down-left"
  | "arrow-right"
  | "external"
  | "more"
  | "coffee"
  | "home"
  | "shopping"
  | "transport"
  | "utilities"
  | "calendar"
  | "close"
  | "eye"
  | "sparkle"
  | "tag"
  | "trash"
  | "edit"
  | "check"
  | "refresh"
  | "wallet"
  | "alert";

const paths: Record<IconName, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </>
  ),
  transactions: (
    <>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
      <path d="M5 5h14" />
    </>
  ),
  budgets: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 4-4 3 2 6-7" />
      <path d="M16 6h4v4" />
    </>
  ),
  goals: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  accounts: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path
        d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z"
        transform="translate(-1 -1)"
      />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.8c-1.2 1.1-1.9 1.5-1.9 3" />
      <path d="M12 17h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  "arrow-up-right": (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  "arrow-down-left": (
    <>
      <path d="M7 7 17 17" />
      <path d="M16 17H7V8" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  external: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  coffee: (
    <>
      <path d="M10 2v2" />
      <path d="M14 2v2" />
      <path d="M4 8h15v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
      <path d="M19 10h1a2 2 0 1 1 0 4h-1" />
    </>
  ),
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1Z" />,
  shopping: (
    <>
      <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 8H6" />
      <circle cx="10" cy="21" r="1" />
      <circle cx="18" cy="21" r="1" />
    </>
  ),
  transport: (
    <>
      <path d="M5 17h14l1-6-2-5H6l-2 5 1 6Z" />
      <path d="M5 12h14" />
      <path d="M7 17v2m10-2v2" />
      <circle cx="8" cy="14.5" r=".5" />
      <circle cx="16" cy="14.5" r=".5" />
    </>
  ),
  utilities: <path d="M13 2 4 14h7l-1 8 10-13h-7Z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  close: (
    <>
      <path d="m18 6-12 12M6 6l12 12" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" />
    </>
  ),
  tag: (
    <>
      <path d="M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
      <path d="M4 6a2 2 0 0 1 2-2h11" />
      <path d="M16 12h5" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
    </>
  ),
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const categoryIcons = new Set<IconName>([
  "overview",
  "transactions",
  "budgets",
  "goals",
  "accounts",
  "settings",
  "help",
  "search",
  "bell",
  "chevron",
  "plus",
  "arrow-up-right",
  "arrow-down-left",
  "arrow-right",
  "external",
  "more",
  "coffee",
  "home",
  "shopping",
  "transport",
  "utilities",
  "calendar",
  "close",
  "eye",
  "sparkle",
  "tag",
  "trash",
  "edit",
  "check",
  "refresh",
  "wallet",
  "alert",
]);

export function resolveCategoryIcon(icon: string | null | undefined): IconName {
  return icon && categoryIcons.has(icon as IconName) ? (icon as IconName) : "tag";
}
