export const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;
export type MatchState = 'upcoming' | 'live' | 'finished' | 'unknown';
export interface MatchTiming {
  kickoff?: string | null;
  dateVerified?: boolean;
  scoreFor?: number | null;
  scoreAgainst?: number | null;
}
export function hasMatchScore(match: MatchTiming): boolean {
  return typeof match.scoreFor === 'number' && typeof match.scoreAgainst === 'number';
}
export function kickoffTimestamp(match: MatchTiming): number | null {
  // Never infer kickoff from an Instagram posting date or an unverified date.
  if (match.dateVerified === false || !match.kickoff || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(match.kickoff)) return null;
  const value = Date.parse(match.kickoff);
  return Number.isFinite(value) ? value : null;
}
export function getMatchState(match: MatchTiming, now: number): MatchState {
  const kickoff = kickoffTimestamp(match);
  if (kickoff === null) return hasMatchScore(match) ? 'finished' : 'unknown';
  if (now < kickoff) return 'upcoming';
  return now < kickoff + MATCH_DURATION_MS ? 'live' : 'finished';
}
export function getCountdown(kickoff: number, now: number) {
  const seconds = Math.max(0, Math.ceil((kickoff - now) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
}
