import React from 'react';

export const QoshqarMuiizCorner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M4 60V24C4 12.954 12.954 4 24 4H60"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M14 48C14 34 22 24 34 20C39 18.3 44 21 44 26C44 30.5 40 34 35.5 34C31.5 34 29 31 30 27.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M48 14C34 14 24 22 20 34C18.3 39 21 44 26 44C30.5 44 34 40 34 35.5C34 31.5 31 29 27.5 30"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const QoshqarMuiizDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-3 select-none ${className}`} aria-hidden="true">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/70 dark:via-amber-400/30 dark:to-amber-400/60" />
    <svg viewBox="0 0 80 24" className="w-16 h-5 text-amber-600 dark:text-amber-400 shrink-0" fill="none">
      <path
        d="M40 4L46 12L40 20L34 12L40 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M34 12C26 12 22 5 15 6C10.5 6.7 9 11 12 14C14.5 16.5 18.5 15.5 19 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M46 12C54 12 58 5 65 6C69.5 6.7 71 11 68 14C65.5 16.5 61.5 15.5 61 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/70 dark:via-amber-400/30 dark:to-amber-400/60" />
  </div>
);

export const QoshqarMuiizEmblem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
    <path
      d="M32 10L42 22L32 34L22 22L32 10Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M32 30L42 42L32 54L22 42L32 30Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M22 32C15 32 11 26 13 20C14.5 16 19 15 21.5 18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M42 32C49 32 53 26 51 20C49.5 16 45 15 42.5 18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M22 32C15 32 11 38 13 44C14.5 48 19 49 21.5 46"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M42 32C49 32 53 38 51 44C49.5 48 45 49 42.5 46"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
