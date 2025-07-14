import { ReactNode } from 'react.ts';
interface LayoutProps {
  children: ReactNode;
}
declare const Layout: ({ children }: LayoutProps) => import('react/jsx-runtime').JSX.Element;
export default Layout;
