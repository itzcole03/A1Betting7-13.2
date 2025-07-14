import React from 'react.ts';
interface CyberSidebarProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}
declare const CyberSidebar: React.FC<CyberSidebarProps>;
export default CyberSidebar;
