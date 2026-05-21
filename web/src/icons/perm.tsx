export function PermCheckIcon({ muted = false }: { muted?: boolean }) {
  if (muted) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path strokeLinecap="round" d="M2 6h8" />
      </svg>
    );
  }
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <polyline points="2,6 4.5,8.5 10,3" />
    </svg>
  );
}
