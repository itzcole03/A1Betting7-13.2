// ============================================================================
// UNIVERSAL PROVIDER SYSTEM EXPORTS;
// ============================================================================

export {
  UniversalThemeProvider,
  useTheme,
  useThemeColors,
  useThemeVariant,
  useDarkMode,
  //   getThemeCSS
} from './UniversalThemeProvider';

export type { ThemeVariant, ThemeColors, ThemeConfig } from './UniversalThemeProvider';

// Default export;
export { default } from './UniversalThemeProvider';

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS (Deprecated - Use Universal equivalents)
// ============================================================================

/**
 * @deprecated Use UniversalThemeProvider instead;
 */
export { UniversalThemeProvider as ThemeProvider } from './UniversalThemeProvider';
