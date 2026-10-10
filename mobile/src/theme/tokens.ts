/**
 * Ferio Visual System Design Tokens
 * Conforming strictly to .agents/skills/ferio-frontend-design/SKILL.md
 * and _doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md
 */

export const ferioColors = {
  // Primary dark canvas & text
  primary: '#111114',
  primaryForeground: '#ffffff',

  // Secondary muted text & icons
  muted: '#6e6e73',
  mutedBackground: '#f3f3f5',

  // Structural borders & dividers
  border: '#e8e8ea',
  borderDark: '#111114',

  // Background canvases
  canvas: '#fafafa',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  // Semantic & status accents
  accent: '#059669', // Emerald - Active, Jammat Countdown, Verified
  accentMuted: '#ecfdf5',
  warning: '#d97706', // Amber - Stale timetables
  warningMuted: '#fffbeb',
  danger: '#dc2626', // Red - Alerts, Reports
  dangerMuted: '#fef2f2',
} as const;

export const ferioSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const ferioRadius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const ferioTypography = {
  titleLarge: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: ferioColors.primary,
  },
  titleMedium: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    color: ferioColors.primary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: ferioColors.primary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: ferioColors.muted,
  },
  tabular: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    fontVariant: ['tabular-nums' as const],
    color: ferioColors.primary,
  },
};
