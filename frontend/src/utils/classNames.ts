// Utility function for conditional CSS class names

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return classNames(...inputs);
}

export default classNames;
