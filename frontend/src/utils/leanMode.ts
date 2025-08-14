/**
 * Lean Mode Utility
 * Determines if the application should run in lean mode with reduced monitoring and features
 * 
 * Lean mode is activated by:
 * - Environment variable: VITE_DEV_LEAN_MODE=true
 * - URL parameter: ?lean=true
 * - localStorage: devLeanMode=true
 */

/**
 * Check if lean mode is enabled
 * @returns true if lean mode is active, false otherwise
 */
export function isLeanMode(): boolean {
  // Check environment variable first
  if (import.meta.env.VITE_DEV_LEAN_MODE === "true") {
    return true;
  }
  
  // Check URL parameters
  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.has("lean") && qs.get("lean") !== "false") {
      return true;
    }
  } catch (error) {
    console.warn("[LeanMode] Failed to parse URL parameters:", error);
  }
  
  // Check localStorage
  try {
    if (localStorage.getItem("devLeanMode") === "true") {
      return true;
    }
  } catch (error) {
    console.warn("[LeanMode] Failed to access localStorage:", error);
  }
  
  return false;
}

/**
 * Set lean mode in localStorage
 * @param enabled whether to enable lean mode
 */
export function setLeanMode(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem("devLeanMode", "true");
    } else {
      localStorage.removeItem("devLeanMode");
    }
  } catch (error) {
    console.warn("[LeanMode] Failed to update localStorage:", error);
  }
}

/**
 * Get lean mode status with details about how it was activated
 * @returns object with lean mode status and activation source
 */
export function getLeanModeStatus(): {
  enabled: boolean;
  source: "environment" | "url" | "localStorage" | "none";
} {
  // Check environment variable
  if (import.meta.env.VITE_DEV_LEAN_MODE === "true") {
    return { enabled: true, source: "environment" };
  }
  
  // Check URL parameters
  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.has("lean") && qs.get("lean") !== "false") {
      return { enabled: true, source: "url" };
    }
  } catch (error) {
    console.warn("[LeanMode] Failed to parse URL parameters:", error);
  }
  
  // Check localStorage
  try {
    if (localStorage.getItem("devLeanMode") === "true") {
      return { enabled: true, source: "localStorage" };
    }
  } catch (error) {
    console.warn("[LeanMode] Failed to access localStorage:", error);
  }
  
  return { enabled: false, source: "none" };
}

/**
 * Log lean mode status to console
 */
export function logLeanModeStatus(): void {
  const status = getLeanModeStatus();
  if (status.enabled) {
    console.info(`[LeanMode] ACTIVE - source: ${status.source} - monitoring and features suppressed`);
  } else {
    console.info("[LeanMode] DISABLED - full monitoring and features active");
  }
}
