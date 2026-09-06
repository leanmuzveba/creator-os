/**
 * Recharts reads literal color strings (SVG props, inline `style` objects) —
 * it can't consume the CSS custom properties in index.css directly — so these
 * helpers branch on the active `theme` from AppContext to keep chart grids,
 * axes, and tooltips in sync with the rest of the themed UI.
 */
import type { CSSProperties } from 'react';
import type { AppTheme } from '../context/AppContext';

export function chartGridColor(theme: AppTheme): string {
  if (theme === 'light-blue') return '#d7e0f5';
  if (theme === 'default') return '#e4e4e7';
  return '#232742';
}

export function chartAxisColor(theme: AppTheme): string {
  if (theme === 'light-blue') return '#5b7fbe';
  if (theme === 'default') return '#71717a';
  return '#64748b';
}

export function chartTooltipStyle(theme: AppTheme): CSSProperties {
  if (theme === 'light-blue') {
    return {
      backgroundColor: '#f1f5fb',
      borderColor: 'rgba(37, 99, 235, 0.2)',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)',
      fontSize: '12px',
    };
  }
  if (theme === 'default') {
    return {
      backgroundColor: '#f4f4f5',
      borderColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      fontSize: '12px',
    };
  }
  return {
    backgroundColor: '#131627',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    fontSize: '12px',
  };
}

export function chartTooltipItemColor(theme: AppTheme): string {
  if (theme === 'light-blue') return '#1d4ed8';
  if (theme === 'default') return '#000000';
  return '#f8fafc';
}
