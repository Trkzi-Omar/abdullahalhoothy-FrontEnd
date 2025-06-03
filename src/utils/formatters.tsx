/**
 * Formats numbers with k/m/b/t suffixes
 * @param num - Number to format
 * @param precision - Decimal places (default: 2)
 * @returns Formatted string
 */
export function formatLargeNumber(num: number, precision: number = 2): string {
  console.log('formatting large number', num);
  if (Math.abs(num) <= 999) return num.toString();

  const suffixes = ['', 'k', 'm', 'b', 't'];
  const sign = num < 0 ? '-' : '';
  let value = Math.abs(num);
  let index = 0;

  while (value >= 1000 && index < suffixes.length - 1) {
    value /= 1000;
    index++;
  }

  return sign + value.toFixed(precision) + suffixes[index];
}
