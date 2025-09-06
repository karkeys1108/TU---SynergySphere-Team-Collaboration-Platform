/**
 * Combines multiple class names into a single string.
 * Filters out falsy values to handle conditional class names.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Formats a date string into a more readable format.
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "January 1, 2023")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncates a string to a specified length and adds an ellipsis if needed.
 * @param str - The string to truncate
 * @param num - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(str: string, num: number): string {
  if (!str) return '';
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
