import type { ComponentPropsWithoutRef, ElementType, ForwardedRef, ReactNode } from 'react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';

import FeatureFlags, { type Feature, type UserContext } from '../utils/FeatureFlags';
import { UnifiedMonitor } from './UnifiedMonitor';

import type { FeatureComponent as FeatureWorkflowComponent } from '../utils/FeatureComposition';

export type FeatureCompositionComponent<T, U> = FeatureWorkflowComponent<T, U>;
export type FeatureComponentContract<T, U> = FeatureWorkflowComponent<T, U>;
export type FeatureComponentRenderArgs = FeatureRenderPropArgs;

type FeatureRenderPropArgs = {
  enabled: boolean;
  feature?: Feature;
};

type BaseElementProps = ComponentPropsWithoutRef<'div'>;

export interface FeatureComponentProps extends Omit<BaseElementProps, 'children'> {
  /** Identifier of the feature flag to evaluate */
  featureId: string;
  /** Optional user context for rollout/targeting */
  userContext?: UserContext;
  /** Optional element type to render (defaults to `section`) */
  as?: ElementType;
  /**
   * Fallback content rendered when the feature is disabled. If omitted, the
   * wrapper element remains hidden for accessibility consistency.
   */
  fallback?: ReactNode | ((args: FeatureRenderPropArgs) => ReactNode);
  /** Children or render-prop evaluated when the feature is enabled */
  children?: ReactNode | ((args: FeatureRenderPropArgs) => ReactNode);
  /** Automatically call `FeatureFlags.initialize()` before evaluation */
  autoInitialize?: boolean;
  /** Callback invoked when the feature renders */
  onExpose?: (feature?: Feature) => void;
  /** Callback invoked when the feature is blocked */
  onBlocked?: (feature?: Feature) => void;
}

interface FeatureEvaluationState {
  enabled: boolean;
  feature?: Feature;
}

const sanitizeContext = (context?: UserContext): string => {
  if (!context) return 'no-context';
  try {
    return JSON.stringify(context);
  } catch {
    return 'context-unserializable';
  }
};

const getInitialState = (featureId: string, userContext?: UserContext): FeatureEvaluationState => {
  const manager = FeatureFlags.getInstance();
  return {
    feature: manager.getFeature(featureId),
    enabled: manager.isFeatureEnabled(featureId, userContext),
  };
};

const FeatureComponent = forwardRef<HTMLElement, FeatureComponentProps>(
  (
    {
      featureId,
      userContext,
      as = 'section',
      fallback = null,
      children,
      autoInitialize = false,
      onExpose,
      onBlocked,
      ...rest
    },
    forwardedRef
  ) => {
    const monitorRef = useRef(UnifiedMonitor.getInstance());
    const featureFlagsRef = useRef(FeatureFlags.getInstance());
    const [state, setState] = useState<FeatureEvaluationState>(() =>
      getInitialState(featureId, userContext)
    );
    const previousEnabledRef = useRef<boolean | null>(null);

    const serializedContext = useMemo(() => sanitizeContext(userContext), [userContext]);

    useEffect(() => {
      let cancelled = false;

      const evaluate = async () => {
        if (autoInitialize) {
          try {
            await featureFlagsRef.current.initialize();
          } catch (error) {
            monitorRef.current.recordMetric('feature_component_init_failure', 1, {
              type: 'counter',
              labels: {
                feature_id: featureId,
                reason: (error as Error)?.name ?? 'unknown',
              },
            });
          }
        }

        const manager = featureFlagsRef.current;
        const nextFeature = manager.getFeature(featureId);
        const nextEnabled = manager.isFeatureEnabled(featureId, userContext);

        if (cancelled) return;

        setState(prev => {
          if (prev.enabled === nextEnabled && prev.feature === nextFeature) {
            return prev;
          }
          return { enabled: nextEnabled, feature: nextFeature };
        });
      };

      evaluate().catch(error => {
        monitorRef.current.recordMetric('feature_component_evaluation_failure', 1, {
          type: 'counter',
          labels: {
            feature_id: featureId,
            reason: (error as Error)?.name ?? 'unknown',
          },
        });
      });

      return () => {
        cancelled = true;
      };
    }, [autoInitialize, featureId, serializedContext, userContext]);

    useEffect(() => {
      if (previousEnabledRef.current === state.enabled) {
        return;
      }
      previousEnabledRef.current = state.enabled;

      monitorRef.current.recordMetric(
        state.enabled ? 'feature_component_exposed' : 'feature_component_blocked',
        1,
        {
          type: 'counter',
          labels: {
            feature_id: featureId,
            state: state.enabled ? 'enabled' : 'disabled',
          },
        }
      );

      if (state.enabled) {
        onExpose?.(state.feature);
      } else {
        onBlocked?.(state.feature);
      }
    }, [featureId, onBlocked, onExpose, state.enabled, state.feature]);

    const renderArgs: FeatureRenderPropArgs = useMemo(
      () => ({ enabled: state.enabled, feature: state.feature }),
      [state.enabled, state.feature]
    );

    const resolvedChildren =
      typeof children === 'function'
        ? (children as (args: FeatureRenderPropArgs) => ReactNode)(renderArgs)
        : children;
    const resolvedFallback =
      typeof fallback === 'function'
        ? (fallback as (args: FeatureRenderPropArgs) => ReactNode)(renderArgs)
        : fallback;

    const content = state.enabled ? resolvedChildren : resolvedFallback;
    const shouldHide = !state.enabled && (content === null || content === undefined);

    const ElementTypeToRender = (as ?? 'section') as ElementType;

    const {
      role: roleProp,
      ['aria-hidden']: ariaHiddenProp,
      hidden: hiddenProp,
      ...restProps
    } = rest;

    const finalRole = roleProp ?? 'region';
    const finalAriaHidden = shouldHide ? true : ariaHiddenProp;
    const finalHidden = hiddenProp ?? shouldHide;

    return (
      <ElementTypeToRender
        {...restProps}
        ref={forwardedRef as ForwardedRef<HTMLElement>}
        role={finalRole}
        data-feature-id={featureId}
        data-feature-enabled={state.enabled ? 'true' : 'false'}
        aria-disabled={state.enabled ? false : true}
        aria-hidden={finalAriaHidden}
        hidden={finalHidden}
      >
        {content}
      </ElementTypeToRender>
    );
  }
);

FeatureComponent.displayName = 'FeatureComponent';

export { FeatureComponent };
export default FeatureComponent;
