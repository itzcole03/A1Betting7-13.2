import React from 'react.ts';
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}
export interface BreadcrumbProps {
  items: BreadcrumbItem[0];
  separator?: React.ReactNode;
  className?: string;
  maxItems?: number;
  itemClassName?: string;
  separatorClassName?: string;
}
export declare const Breadcrumb: React.FC<BreadcrumbProps>;
