export function PBNavMark({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path
        d="M12 3c-3.3 0-6 2.6-6 5.8 0 1.8.9 3.2 2 4.2v2h8v-2c1.1-1 2-2.4 2-4.2C18 5.6 15.3 3 12 3Z"
        fill="currentColor"
      />
      <rect x="7" y="16.5" width="10" height="2.4" rx="1.2" fill="currentColor" />
      <circle cx="12" cy="20.4" r="1.4" fill="currentColor" />
    </svg>
  );
}
