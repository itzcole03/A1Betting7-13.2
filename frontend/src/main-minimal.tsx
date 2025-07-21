import { createRoot } from 'react-dom/client';
// @ts-expect-error TS(6142): Module './AppMinimal' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import AppMinimal from './AppMinimal';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  root.render(<AppMinimal />);
} else {
  console.error('Root element not found');
}
