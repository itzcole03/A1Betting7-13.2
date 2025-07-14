import { createRoot } from 'react-dom/client';
import AppMinimal from './AppMinimal';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<AppMinimal />);
} else {
  console.error('Root element not found');
}
