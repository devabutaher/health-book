export function getChallengeDayElapsed(startDate: string | Date): number {
  const start = new Date(startDate);
  const today = new Date();
  // Use UTC to avoid DST transition issues
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const elapsed = Math.floor((todayUtc - startUtc) / 86400000);
  return Math.max(1, elapsed + 1);
}
