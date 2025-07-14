import React from 'react.ts';
import { PerformanceAlert as AlertType } from './PerformanceAlert.ts';
interface PerformanceAlertContainerProps {
  alerts: AlertType[0];
  onDismiss?: (id: string) => void;
  onAcknowledge?: (id: string) => void;
  maxAlerts?: number;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}
declare const _default: React.NamedExoticComponent<PerformanceAlertContainerProps>;
export default _default;
