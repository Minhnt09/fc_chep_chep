import '@angular/compiler';
import { signal } from '@angular/core';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMembers } from '../src/services/content';
import { InteractionsService, InteractionsBackend, Visitor, TEAM_TARGET, emptyReactionSummary } from '../src/services/interactions.service';
import { SupabaseInteractionsAdapter, interactionError } from '../src/services/supabase-interactions.adapter';
const first = getMembers()[0];
class FakeBackend implements InteractionsBackend {
  readonly sessionWarning = signal('');
  visitor: Visitor | null = null;
  calls: { name: string; args: Record<string, unknown> }[] = [];
  handler: (name: string, args: Record<string, unknown>) => unknown = () => null;
  async restoreVisitor() { return this.visitor; }
  onVisitorChange(_callback: (visitor: Visitor | null) => void) { return () => {}; }
  async saveVisitor(name: string) { return this.visitor = { id: this.visitor?.id ?? 'supabase-auth-uid', displayName: name }; }
  async rpc<T>(name: string, args: Record<string, unknown> = {}) { this.calls.push({ name, args }); return await this.handler(name, args) as T; }
}
function setup() { const backend = new FakeBackend(); const service = new InteractionsService(backend as unknown as SupabaseInteractionsAdapter); return { backend, service }; }

test('does not read old local data or create an anonymous visitor on public reads', async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem() { throw Error('old storage must not be read'); }, setItem() { throw Error('must not persist interactions'); } } });
  const { backend, service } = setup(); backend.handler = () => ({ count: 0, average: null, ownReview: null, hasReviewed: false });
  assert.equal((await service.getTeamStats()).count, 0);
  assert.equal(await service.getVisitor(), null);
  assert.equal(backend.visitor, null); assert.equal(backend.calls[0].name, 'fc_team_stats');
});
test('name is trimmed, validated, comes from auth UID and rename retains identity', async () => {
  const { service } = setup();
  await assert.rejects(service.saveVisitor(' ')); await assert.rejects(service.saveVisitor('x'.repeat(31)));
  const visitor = await service.saveVisitor('  Minh  '); assert.equal(visitor.displayName, 'Minh'); assert.equal(visitor.id, 'supabase-auth-uid');
  assert.equal((await service.saveVisitor('Tên mới')).id, visitor.id);
});
test('writes use RPC with no client UUID/timestamp/hidden; reactions send idempotent desired state', async () => {
  const { backend, service } = setup(); await service.saveVisitor('Minh'); backend.handler = () => emptyReactionSummary();
  await service.toggleReaction(TEAM_TARGET, 'heart', true);
  assert.deepEqual(backend.calls[0], { name: 'fc_set_reaction', args: { p_target_type: 'team', p_target_id: 'fc-chep-chep', p_reaction_type: 'heart', p_selected: true } });
  await service.addComment(first.id, '  Cổ vũ!  ');
  assert.deepEqual(backend.calls[1], { name: 'fc_add_comment', args: { p_player_id: first.id, p_display_name: 'Minh', p_content: 'Cổ vũ!' } });
  await service.addReview(5, 'Nhiệt tình');
  assert.deepEqual(backend.calls[2], { name: 'fc_add_review', args: { p_display_name: 'Minh', p_rating: 5, p_content: 'Nhiệt tình' } });
});
test('invalid payloads do not reach database; pagination is bounded and target-specific', async () => {
  const { backend, service } = setup(); await service.saveVisitor('Minh');
  for (const rating of [0,6,2.5]) await assert.rejects(service.addReview(rating, 'Nội dung'));
  await assert.rejects(service.addReview(5,' ')); await assert.rejects(service.addReview(5,'x'.repeat(301)));
  await assert.rejects(service.addComment(first.id,'x'.repeat(201))); await assert.rejects(service.addComment('unknown','Nội dung'));
  assert.equal(backend.calls.length,0);
  await service.listComments(first.id,-1,100);
  assert.deepEqual(backend.calls[0], { name:'fc_comments_page', args:{p_player_id:first.id,p_offset:0,p_limit:10} });
  await service.listReviews(5,5); assert.equal(backend.calls[1].args['p_offset'],5);
});
test('network/database errors propagate without local fallback, success revision or fake totals', async () => {
  const { backend, service } = setup(); await service.saveVisitor('Minh');
  const revision = service.revision(); backend.handler = () => { throw Error('Bạn vừa gửi nội dung. Vui lòng đợi 30 giây rồi thử lại.'); };
  await assert.rejects(service.addComment(first.id,'Draft'),/đợi/);
  assert.equal(service.revision(),revision);
  backend.handler = () => { throw Error('Network offline'); };
  await assert.rejects(service.addReview(5,'Draft'),/offline/);
  assert.equal(service.revision(),revision);
});
test('restoration awaits existing session and backend errors have actionable safe messages', async () => {
  const backend = new FakeBackend(); backend.visitor = { id:'existing-auth-uid',displayName:'Fan' };
  const service = new InteractionsService(backend as unknown as SupabaseInteractionsAdapter);
  assert.equal((await service.getVisitor())?.id,'existing-auth-uid');
  assert.match(interactionError({code:'PGRST202'}).message,/SQL/);
  assert.match(interactionError({code:'anonymous_provider_disabled'}).message,/Anonymous/);
  assert.match(interactionError({code:'P0001',message:'Vui lòng đợi 30 giây'}).message,/đợi/);
  assert.match(interactionError(new TypeError('Failed to fetch')).message,/chưa được xác nhận gửi/);
});

test('player heart counts are separate from total reactions and remain keyed by stable player ID', async () => {
  const { backend, service } = setup();
  backend.handler = (name, args) => {
    if (name === 'fc_player_stats') return Object.fromEntries(getMembers().map(m => [m.id, { reactions: 20, comments: 2 }]));
    const summary = emptyReactionSummary(); summary.total = 20; summary.counts.fire = 19;
    summary.counts.heart = args['p_target_id'] === first.id ? 1 : 0;
    return summary;
  };
  const stats = await service.getPlayerStats();
  assert.equal(stats[first.id].hearts, 1); assert.equal(stats[first.id].reactions, 20);
  assert.equal(stats[getMembers()[1].id].hearts, 0); assert.equal(stats[first.id].comments, 2);
  assert.equal(Object.keys(stats).length, getMembers().length);
});
