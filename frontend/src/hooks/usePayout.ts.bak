export function calculatePayout(selectedCount: number, entryAmount: number): number {
  const multipliers: Record<number, number> = { 2: 3, 3: 5, 4: 10, 5: 20, 6: 50 };
  return selectedCount >= 2 ? entryAmount * (multipliers[selectedCount] || 0) : 0;
}
