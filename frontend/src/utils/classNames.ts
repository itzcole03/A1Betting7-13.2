// Utility function for conditional CSS class names

export function classNames(_...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function cn(_...inputs: (string | undefined | null | false)[]): string {
  return classNames(...inputs);
}

export default classNames;
