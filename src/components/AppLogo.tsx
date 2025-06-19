import type React from 'react';

const AppLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      width="currentcolor"
      height="currentcolor"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GlicemiaAI Logo"
    >
      <circle cx="50" cy="50" r="45" fill="hsl(var(--primary))" />
      <path
        d="M30 65Q35 50 50 50Q65 50 70 65"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M50 30V50"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="50" cy="25" r="7" fill="hsl(var(--accent))" />
    </svg>
  );
};

export default AppLogo;
