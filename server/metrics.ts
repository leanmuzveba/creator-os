/**
 * Metric string helpers for the analytics endpoint: convert between abbreviated
 * metric strings (e.g. "1.2K", "3.4M") and raw numbers.
 */

/** Parse an abbreviated metric string/number (e.g. "1.2K", "3M", 4500) into a number. */
export function parseMetricServer(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim().toUpperCase().replace(/,/g, '');
  if (str.endsWith('B')) return (parseFloat(str.slice(0, -1)) || 0) * 1000000000;
  if (str.endsWith('M')) return (parseFloat(str.slice(0, -1)) || 0) * 1000000;
  if (str.endsWith('K')) return (parseFloat(str.slice(0, -1)) || 0) * 1000;
  return parseFloat(str) || 0;
}

/** Format a number as an abbreviated metric string (e.g. 1200 → "1.2K"). */
export function formatMetricServer(num: number): string {
  if (isNaN(num) || num <= 0) return '0';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return Math.round(num).toLocaleString();
}

/**
 * Compute a formatted percent-change string (e.g. "+12.4%") between a
 * previously-stored metric value and a freshly-synced one. Used to turn a
 * static seed-data growth badge into a real one after an OAuth reconnect.
 */
export function computeGrowth(oldVal: string | number | undefined | null, newVal: string | number | undefined | null): string {
  const oldNum = parseMetricServer(oldVal);
  const newNum = parseMetricServer(newVal);
  if (oldNum <= 0) return newNum > 0 ? '+100.0%' : '0.0%';
  const pct = ((newNum - oldNum) / oldNum) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}
