import React from 'react';

export default function LoadingSkeleton({ rows = 4, height = 'h-24', className = '' }) {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className={`w-full bg-[#122337]/70 border border-slate-800/80 rounded-xl ${height}`}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
