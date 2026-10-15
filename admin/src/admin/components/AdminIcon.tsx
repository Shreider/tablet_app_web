export type AdminIconName =
  | 'calendar'
  | 'rooms'
  | 'grid'
  | 'book'
  | 'layers'
  | 'users'
  | 'alert'
  | 'menu'
  | 'close'
  | 'logout'
  | 'external'
  | 'right';

const paths: Record<AdminIconName, JSX.Element> = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7 3v4m10-4v4M3 11h18m-11 4h2m4 0h2m-8 3h2" />
    </>
  ),
  rooms: (
    <>
      <path d="M4 21h16M6 21V4l12-2v19M10 12h.01" />
      <path d="M18 6h3v15" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  book: <path d="M12 5v16M3 3c4-1 6 0 9 2 3-2 5-3 9-2v16c-4-1-6 0-9 2-3-2-5-3-9-2Z" />,
  layers: <path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5" />,
  users: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 5" />
    </>
  ),
  alert: (
    <>
      <path d="m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0Z" />
      <path d="M12 9v4m0 4h.01" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  logout: <path d="M9 4H4v16h5m6-12 4 4-4 4M9 12h10" />,
  external: (
    <path d="M14 3h7v7m0-7L10 14M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
  ),
  right: <path d="m14 5 7 7-7 7M21 12H3" />
};

export function AdminIcon({
  name,
  size = 20
}: {
  name: AdminIconName;
  size?: number;
}): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
