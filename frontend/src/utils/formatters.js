/**
 * Utility formatters for UK Wind Power Analytics (WindIQ)
 * Standardizes MW/GW units, percentages, and UTC timestamp display.
 */

export function formatMW(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} MW`;
}

export function formatGW(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${(Number(val) / 1000).toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} GW`;
}

export function formatMWh(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} MWh`;
}

export function formatGWh(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${(Number(val) / 1000).toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} GWh`;
}

export function formatSignedMW(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const num = Number(val);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })} MW`;
}

export function formatPct(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toFixed(decimals)}%`;
}

export function formatUTCDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(parts[1], 10) - 1];
      const day = parseInt(parts[2], 10);
      return `${day} ${month} ${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatUTCTime(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')} UTC`;
  } catch {
    return isoStr;
  }
}

export function formatFullUTCTimestamp(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const mins = d.getUTCMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${mins} UTC`;
  } catch {
    return dateStr;
  }
}

export function formatGBP(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const num = Number(val);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    return `${sign}£${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}£${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}£${(abs / 1_000).toFixed(1)}k`;
  }
  return `${sign}£${abs.toFixed(decimals)}`;
}

export function formatWatts(wattsVal) {
  if (wattsVal === null || wattsVal === undefined || isNaN(wattsVal)) return '—';
  const num = Number(wattsVal);
  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(2)} TW`;
  }
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)} GW`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)} MW`;
  }
  return `${num.toLocaleString()} W`;
}
