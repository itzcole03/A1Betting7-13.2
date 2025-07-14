import { Component, ErrorInfo, ReactNode } from 'react.ts';
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}
declare class GlobalErrorBoundary extends Component<Props, State> {
  state: State;
  static getDerivedStateFromError(_: Error): State;
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
  render():
    | string
    | number
    | boolean
    | import('react/jsx-runtime').JSX.Element
    | Iterable<ReactNode>
    | null
    | undefined;
}
export { GlobalErrorBoundary };
