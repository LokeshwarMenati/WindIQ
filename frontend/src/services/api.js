/**
 * API client for UK Day-Ahead Wind Forecast & Procurement Platform.
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
    throw new Error(`API Error [${response.status}]: ${errorText || response.statusText}`);
  }
  return response.json();
}

export const api = {
  // Get available January 2026 delivery dates
  getAvailableDates: () => fetchJSON('/api/forecast/available-dates'),

  // Get Day-Ahead forecast curve with cutoff time for a delivery date
  getDayAheadForecast: (deliveryDate, gateClosureTime = '11:00') =>
    fetchJSON(`/api/forecast/day-ahead?deliveryDate=${encodeURIComponent(deliveryDate)}&gateClosureTime=${encodeURIComponent(gateClosureTime)}`),

  // Trace multi-horizon forecast evolution for a specific settlement period
  getForecastEvolution: (startTime) =>
    fetchJSON(`/api/forecast/evolution?startTime=${encodeURIComponent(startTime)}`),

  // Get quantitative accuracy metrics
  getAccuracyMetrics: (deliveryDate = null, gateClosureTime = '11:00') => {
    const query = deliveryDate ? `?deliveryDate=${encodeURIComponent(deliveryDate)}&gateClosureTime=${encodeURIComponent(gateClosureTime)}` : `?gateClosureTime=${encodeURIComponent(gateClosureTime)}`;
    return fetchJSON(`/api/accuracy/metrics${query}`);
  },

  // Get diurnal profile across 48 settlement periods for full month
  getDiurnalProfile: (gateClosureTime = '11:00') =>
    fetchJSON(`/api/accuracy/diurnal?gateClosureTime=${encodeURIComponent(gateClosureTime)}`),

  // Get month-wide overview
  getMonthlyOverview: (gateClosureTime = '11:00') =>
    fetchJSON(`/api/accuracy/monthly-overview?gateClosureTime=${encodeURIComponent(gateClosureTime)}`),

  // Calculate day-ahead thermal procurement recommendation with buffer
  calculateProcurementPlan: (payload) =>
    fetchJSON('/api/procurement/plan', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Get data provenance and sync status
  getSyncStatus: () => fetchJSON('/api/sync/status'),
};
