import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({
  value,
  duration = 800,
  decimals = 1,
  prefix = '',
  suffix = '',
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    if (value === null || value === undefined || isNaN(value)) {
      setDisplayValue(0);
      return;
    }

    const startValue = displayValue;
    const endValue = Number(value);
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(endValue);
      }
    }

    requestAnimationFrame(update);
  }, [value, duration]);

  if (value === null || value === undefined || isNaN(value)) {
    return <span className={className}>—</span>;
  }

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString('en-GB', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  );
}
