import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMatchState, getCountdown, MATCH_DURATION_MS } from '../src/services/match-status';
const match = { kickoff: '2026-10-08T19:30:00+07:00', dateVerified: true };
const start = Date.parse('2026-10-08T12:30:00Z');
test('match is upcoming before kickoff regardless of manual status', () => {
  assert.equal(getMatchState({ ...match, ...{ status: 'played' } }, start - 1), 'upcoming');
});
test('match is live at kickoff and until the two-hour boundary', () => {
  assert.equal(getMatchState(match, start), 'live');
  assert.equal(getMatchState(match, start + MATCH_DURATION_MS - 1), 'live');
});
test('match is finished at the duration boundary without requiring a score', () => {
  assert.equal(getMatchState(match, start + MATCH_DURATION_MS), 'finished');
  assert.equal(getMatchState(match, start + MATCH_DURATION_MS + 1), 'finished');
});
test('missing, invalid or unverified kickoff does not infer a schedule from old data', () => {
  for (const kickoff of [undefined, null, '', 'invalid', '2026-10-08', '2026-10-08T19:30:00']) {
    assert.equal(getMatchState({ kickoff }, start), 'unknown');
  }
  assert.equal(getMatchState({ ...match, dateVerified: false }, start + MATCH_DURATION_MS), 'unknown');
  assert.equal(getMatchState({ kickoff: null, scoreFor: 0, scoreAgainst: 0 }, start), 'finished');
  assert.equal(getMatchState({ kickoff: null, scoreFor: 1 }, start), 'unknown');
});
test('countdown splits days, hours, minutes and seconds and never goes negative', () => {
  assert.deepEqual(getCountdown(start + 90061000, start), { days: 1, hours: 1, minutes: 1, seconds: 1 });
  assert.deepEqual(getCountdown(start, start + 1000), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});
