/**
 * API client for WindIQ — UK Renewable Energy Forecast Analytics Platform.
 * Communicates with the FastAPI backend service.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJSON(url, options = {}) {
  const fullUrl = `${API_BASE}${url}`;
  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) parsedMessage = parsed.detail;
    } catch {
      // keep original
    }
    throw new Error(`API Error [${response.status}]: ${parsedMessage || response.statusText}`);
  }
  return response.json();
}

export const api = {
  // GET /api/health
  getHealth: () => fetchJSON('/api/health'),

  // GET /api/overview?start_date=2026-01-01&end_date=2026-01-31&cutoff_time=11:00
  getOverview: (startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '11:00') => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      cutoff_time: cutoffTime
    });
    return fetchJSON(`/api/overview?${params.toString()}`);
  },

  // GET /api/forecasts?delivery_date=2026-01-15&cutoff_time=11:00
  getForecasts: (deliveryDate = '2026-01-15', cutoffTime = '11:00') => {
    const params = new URLSearchParams({
      delivery_date: deliveryDate,
      cutoff_time: cutoffTime
    });
    return fetchJSON(`/api/forecasts?${params.toString()}`);
  },

  // GET /api/accuracy?start_date=2026-01-01&end_date=2026-01-31&cutoff_time=11:00
  getAccuracy: (startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '11:00') => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      cutoff_time: cutoffTime
    });
    return fetchJSON(`/api/accuracy?${params.toString()}`);
  },

  // GET /api/vintages?delivery_date=2026-01-15
  getVintages: (deliveryDate = '2026-01-15') => {
    const params = new URLSearchParams({
      delivery_date: deliveryDate
    });
    return fetchJSON(`/api/vintages?${params.toString()}`);
  },

  // POST /api/refresh
  postRefresh: () => {
    return fetchJSON('/api/refresh', {
      method: 'POST'
    });
  },

  // Available dates for January 2026
  getAvailableDates: async () => {
    try {
      const res = await fetchJSON('/api/forecasts?delivery_date=2026-01-15&cutoff_time=11:00');
      if (res && res.availableDates) return res.availableDates;
    } catch {
      // Fallback
    }
    // Return all 31 days of January 2026
    return Array.from({ length: 31 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
  },

  // Legacy compatibility helpers
  getDayAheadForecast: (deliveryDate, gateClosureTime = '11:00') =>
    fetchJSON(`/api/forecasts?delivery_date=${encodeURIComponent(deliveryDate)}&cutoff_time=${encodeURIComponent(gateClosureTime)}`),

  getForecastEvolution: (startTime) =>
    fetchJSON(`/api/forecast/evolution?startTime=${encodeURIComponent(startTime)}`),

  calculateProcurementPlan: (payload) =>
    fetchJSON('/api/procurement/plan', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSyncStatus: () => fetchJSON('/api/health'),
};
