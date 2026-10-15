type IconName = 'calendar' | 'close' | 'refresh' | 'left' | 'right' | 'chevron' | 'info';

const paths: Record<IconName, JSX.Element> = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7 3v4m10-4v4M3 11h18m-11 4h2m4 0h2m-8 3h2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6 6a8 8 0 0 1 13 2m-1 10A8 8 0 0 1 5 16" />
    </>
  ),
  left: <path d="m10 5-7 7 7 7M3 12h18" />,
  right: <path d="m14 5 7 7-7 7M21 12H3" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10h.01" />
    </>
  )
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }): JSX.Element {
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
