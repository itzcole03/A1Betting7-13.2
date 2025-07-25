import * as React from 'react.ts';
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export declare const _Tabs: React.FC<TabsProps>;
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export declare const _TabsList: React.FC<TabsListProps>;
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}
export declare const _TabsTrigger: React.FC<TabsTriggerProps>;
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export declare const _TabsContent: React.FC<TabsContentProps>;
