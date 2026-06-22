/** Эмблема платформы: треугольник с глазом («всевидящее око»), золото (ТЗ §8). */
export function BrandMark({ size = 60 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      stroke="var(--gold-bright)"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <circle cx="30" cy="31" r="26" />
      <polygon points="30,10 51,46 9,46" />
      <path d="M21 34c3-5 15-5 18 0c-3 5-15 5-18 0z" />
      <circle cx="30" cy="34" r="2.4" fill="var(--gold-bright)" stroke="none" />
    </svg>
  );
}
