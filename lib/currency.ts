export const toCents = (egp: number | undefined | null): number => {
  if (egp === undefined || egp === null || isNaN(egp)) return 0;
  return Math.round(egp * 100);
};

export const toEGP = (cents: number | undefined | null): number => {
  if (cents === undefined || cents === null || isNaN(cents)) return 0;
  return cents / 100;
};

export function formatCurrency(value: number | string | undefined | null): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(numValue)) return '0 ج.م';
  return `${numValue.toLocaleString('en-US')} ج.م`;
}
