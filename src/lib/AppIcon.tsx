interface AppIconProps {
  size?: number;
  className?: string;
}

export function AppIcon({ size = 24, className }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#0a0a0a" />

      {/* Top-left bracket */}
      <path d="M9 16V9h7" stroke="white" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />

      {/* Bottom-right bracket */}
      <path d="M23 16v7h-7" stroke="white" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />

      {/* Center dot */}
      <rect x="14.5" y="14.5" width="3" height="3" fill="white" opacity="0.9" />
    </svg>
  );
}
