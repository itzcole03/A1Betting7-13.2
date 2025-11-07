export interface TelemetryContext {
  channel?: string;
  feature?: string;
  component?: string;
}

type OverrideKey = `channel:${string}` | `feature:${string}` | `component:${string}`;

type EnvRecord = { [key: string]: string | undefined };

function parseBooleanFlag(value: string | undefined): boolean | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  return undefined;
}

function readInitialConsent(): boolean {
  // Highest priority: explicit global toggle set by host app/tests.
  if (typeof globalThis !== 'undefined') {
    const globalAny = globalThis as Record<string, unknown>;
    if (typeof globalAny.__TELEMETRY_CONSENT__ === 'boolean') {
      return globalAny.__TELEMETRY_CONSENT__ as boolean;
    }
    if (typeof globalAny.__TELEMETRY_DISABLED__ === 'boolean') {
      return !(globalAny.__TELEMETRY_DISABLED__ as boolean);
    }
  }

  // Next: environment toggles.
  const env: EnvRecord | undefined =
    typeof process !== 'undefined' && process.env ? (process.env as EnvRecord) : undefined;
  if (env) {
    const enabledFlag =
      parseBooleanFlag(env.TELEMETRY_ENABLED) ?? parseBooleanFlag(env.VITE_TELEMETRY_ENABLED);
    if (typeof enabledFlag === 'boolean') return enabledFlag;

    const disabledFlag =
      parseBooleanFlag(env.TELEMETRY_DISABLED) ?? parseBooleanFlag(env.VITE_TELEMETRY_DISABLED);
    if (typeof disabledFlag === 'boolean') return !disabledFlag;
  }

  // Default: consent granted (telemetry allowed).
  return true;
}

function overrideKeyFromContext(context: TelemetryContext): OverrideKey | undefined {
  if (context.feature) return `feature:${context.feature}`;
  if (context.channel) return `channel:${context.channel}`;
  if (context.component) return `component:${context.component}`;
  return undefined;
}

export class TelemetryGate {
  private static instance: TelemetryGate | null = null;

  private consent: boolean;
  private overrides = new Map<OverrideKey, boolean>();

  private constructor() {
    this.consent = readInitialConsent();
  }

  public static getInstance(): TelemetryGate {
    if (!TelemetryGate.instance) TelemetryGate.instance = new TelemetryGate();
    return TelemetryGate.instance;
  }

  public isAllowed(context?: TelemetryContext): boolean {
    if (!this.consent) return false;
    if (!context) return true;

    const keys: OverrideKey[] = [];
    if (context.feature) keys.push(`feature:${context.feature}`);
    if (context.channel) keys.push(`channel:${context.channel}`);
    if (context.component) keys.push(`component:${context.component}`);

    for (const key of keys) {
      if (this.overrides.has(key)) return this.overrides.get(key) as boolean;
    }

    return true;
  }

  public setConsent(enabled: boolean): void {
    this.consent = enabled;
  }

  public setOverride(context: TelemetryContext, allowed: boolean): void {
    const key = overrideKeyFromContext(context);
    if (!key) return;
    this.overrides.set(key, allowed);
  }

  public clearOverride(context: TelemetryContext): void {
    const key = overrideKeyFromContext(context);
    if (!key) return;
    this.overrides.delete(key);
  }

  public reset(consent?: boolean): void {
    if (typeof consent === 'boolean') {
      this.consent = consent;
    } else {
      this.consent = readInitialConsent();
    }
    this.overrides.clear();
  }

  public runIfAllowed<T>(context: TelemetryContext | undefined, fn: () => T): T | undefined {
    if (!this.isAllowed(context)) return undefined;
    return fn();
  }
}

export const telemetryGate = TelemetryGate.getInstance();

export function isTelemetryAllowed(context?: TelemetryContext): boolean {
  return TelemetryGate.getInstance().isAllowed(context);
}

export function setTelemetryConsent(enabled: boolean): void {
  TelemetryGate.getInstance().setConsent(enabled);
}

export function setTelemetryOverride(context: TelemetryContext, allowed: boolean): void {
  TelemetryGate.getInstance().setOverride(context, allowed);
}

export function clearTelemetryOverride(context: TelemetryContext): void {
  TelemetryGate.getInstance().clearOverride(context);
}

export function resetTelemetryGate(consent?: boolean): void {
  TelemetryGate.getInstance().reset(consent);
}

export function runWithTelemetry<T>(
  context: TelemetryContext | undefined,
  fn: () => T
): T | undefined {
  return TelemetryGate.getInstance().runIfAllowed(context, fn);
}

export default TelemetryGate;
