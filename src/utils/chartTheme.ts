/**
 * Recharts reads literal color strings (SVG props, inline `style` objects) —
 * it can't consume the CSS custom properties in index.css directly — so these
 * helpers branch on the active `theme` from AppContext to keep chart grids,
 * axes, and tooltips in sync with the rest of the themed UI.
 */
import type { CSSProperties } from 'react';

export function chartGridColor(theme: 'dark' | 'light'): string {
  return theme === 'light' ? '#d7e0f5' : '#232742';
}

export function chartAxisColor(theme: 'dark' | 'light'): string {
  return theme === 'light' ? '#5b7fbe' : '#64748b';
}

export function chartTooltipStyle(theme: 'dark' | 'light'): CSSProperties {
  return {
    backgroundColor: theme === 'light' ? '#f1f5fb' : '#131627',
    borderColor: theme === 'light' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    boxShadow: theme === 'light' ? '0 8px 24px rgba(37, 99, 235, 0.15)' : '0 8px 24px rgba(0, 0, 0, 0.5)',
    fontSize: '12px',
  };
}

export function chartTooltipItemColor(theme: 'dark' | 'light'): string {
  return theme === 'light' ? '#1d4ed8' : '#f8fafc';
}
