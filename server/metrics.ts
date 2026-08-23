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
