export function getChallengeDayElapsed(startDate: string | Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const elapsed = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.max(1, elapsed + 1);
}
