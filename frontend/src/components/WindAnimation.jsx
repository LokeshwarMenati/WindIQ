import React from 'react';
import { motion } from 'framer-motion';

export default function WindAnimation({ className = '' }) {
  const isReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isReducedMotion) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden pointer-events-none select-none opacity-40 ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="windMint" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#42DDB2" stopOpacity="0" />
            <stop offset="40%" stopColor="#42DDB2" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#78A8FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#78A8FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="windElectric" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78A8FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#78A8FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#42DDB2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="glowDot" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#42DDB2" />
            <stop offset="100%" stopColor="#78A8FF" />
          </linearGradient>
        </defs>

        {/* Streamline 1 */}
        <motion.path
          d="M -200 40 C 150 10, 350 70, 700 35 C 950 10, 1150 50, 1300 40"
          stroke="url(#windMint)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathOffset: 0 }}
          animate={{ pathOffset: [0, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />

        {/* Streamline 2 */}
        <motion.path
          d="M -150 95 C 100 120, 400 65, 800 110 C 1050 135, 1200 85, 1350 95"
          stroke="url(#windElectric)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathOffset: 0 }}
          animate={{ pathOffset: [0, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />

        {/* Streamline 3 */}
        <motion.path
          d="M -100 160 C 200 140, 500 190, 850 150 C 1050 130, 1250 170, 1400 160"
          stroke="url(#windMint)"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={{ pathOffset: 0 }}
          animate={{ pathOffset: [0, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear", delay: 1 }}
        />

        {/* Streamline 4 */}
        <motion.path
          d="M -250 210 C 120 180, 450 230, 750 200 C 1000 180, 1180 220, 1380 210"
          stroke="url(#windElectric)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathOffset: 0 }}
          animate={{ pathOffset: [0, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        />

        {/* Drifting wind particles */}
        <motion.circle
          r="2.5"
          fill="url(#glowDot)"
          initial={{ cx: -50, cy: 40, opacity: 0 }}
          animate={{ cx: [ -50, 1100 ], cy: [ 40, 45, 35, 42 ], opacity: [ 0, 0.9, 0.9, 0 ] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0 }}
        />
        <motion.circle
          r="3"
          fill="url(#glowDot)"
          initial={{ cx: -30, cy: 110, opacity: 0 }}
          animate={{ cx: [ -30, 1120 ], cy: [ 110, 85, 115, 95 ], opacity: [ 0, 0.8, 0.8, 0 ] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
        <motion.circle
          r="2"
          fill="url(#glowDot)"
          initial={{ cx: -40, cy: 160, opacity: 0 }}
          animate={{ cx: [ -40, 1150 ], cy: [ 160, 145, 175, 155 ], opacity: [ 0, 0.7, 0.7, 0 ] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
      </svg>
    </div>
  );
}
