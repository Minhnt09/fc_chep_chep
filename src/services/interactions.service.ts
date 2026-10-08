import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { getMembers } from './content';
import { SupabaseInteractionsAdapter } from './supabase-interactions.adapter';
import { Comment, InteractionTarget, Page, PlayerStats, REACTION_TYPES, ReactionSummary, ReactionType, Review, TEAM_TARGET, TeamStats, Visitor } from './interactions.types';
export * from './interactions.types';
const playerIds = getMembers().map(member => member.id);

@Injectable({ providedIn: 'root' })
export class InteractionsService implements OnDestroy {
  readonly revision = signal(0);
  readonly visitor = signal<Visitor | null>(null);
  readonly sessionWarning;
  private readonly ready: Promise<void>;
  private readonly unsubscribe: () => void;
  constructor(private readonly backend: SupabaseInteractionsAdapter = inject(SupabaseInteractionsAdapter)) {
    this.sessionWarning = backend.sessionWarning;
    this.unsubscribe = backend.onVisitorChange(visitor => this.setVisitor(visitor));
    this.ready = backend.restoreVisitor().then(visitor => this.setVisitor(visitor));
    // Every request still awaits/reports the error; avoid unhandled rejection during app init.
    void this.ready.catch(() => {});
  }
  private setVisitor(visitor: Visitor | null) {
    if (this.visitor()?.id === visitor?.id && this.visitor()?.displayName === visitor?.displayName) return;
    this.visitor.set(visitor); this.revision.update(value => value + 1);
  }
  private text(value: string, max: number, label: string) {
    const result = value.trim();
    if (!result || result.length > max) throw Error(`${label} cần có từ 1 đến ${max} ký tự.`);
    return result;
  }
  private target(target: InteractionTarget) {
    if (!(target.type === 'team' && target.id === TEAM_TARGET.id || target.type === 'player' && playerIds.includes(target.id))) throw Error('Đối tượng tương tác không hợp lệ.');
  }
  async getVisitor() { await this.ready; return this.visitor(); }
  async saveVisitor(name: string): Promise<Visitor> {
    const displayName = this.text(name, 30, 'Tên hiển thị');
    await this.ready;
    const visitor = await this.backend.saveVisitor(displayName); this.setVisitor(visitor); return visitor;
  }
  private async requireVisitor() { await this.ready; const visitor = this.visitor(); if (!visitor) throw Error('Hãy nhập tên hiển thị trước.'); return visitor; }
  async getReactionSummary(target: InteractionTarget): Promise<ReactionSummary> {
    this.target(target); await this.ready;
    return this.backend.rpc('fc_reaction_summary', { p_target_type: target.type, p_target_id: target.id });
  }
  async toggleReaction(target: InteractionTarget, type: ReactionType, selected?: boolean): Promise<ReactionSummary> {
    this.target(target); if (!REACTION_TYPES.includes(type)) throw Error('Cảm xúc không hợp lệ.');
    await this.requireVisitor();
    const desired = selected ?? !(await this.getReactionSummary(target)).selected.includes(type);
    const summary = await this.backend.rpc<ReactionSummary>('fc_set_reaction', { p_target_type: target.type, p_target_id: target.id, p_reaction_type: type, p_selected: desired });
    this.revision.update(value => value + 1); return summary;
  }
  async getTeamStats(): Promise<TeamStats> { await this.ready; return this.backend.rpc('fc_team_stats'); }
  private pagination(offset: number, limit: number) {
    return { p_offset: Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0, p_limit: Number.isFinite(limit) ? Math.min(10, Math.max(1, Math.floor(limit))) : 5 };
  }
  async listReviews(offset = 0, limit = 5): Promise<Page<Review>> {
    await this.ready; return this.backend.rpc('fc_reviews_page', this.pagination(offset, limit));
  }
  async listComments(playerId: string, offset = 0, limit = 5): Promise<Page<Comment>> {
    this.target({ type: 'player', id: playerId }); await this.ready;
    return this.backend.rpc('fc_comments_page', { p_player_id: playerId, ...this.pagination(offset, limit) });
  }
  async getPlayerStats(): Promise<PlayerStats> { await this.ready; return this.backend.rpc('fc_player_stats', { p_player_ids: playerIds }); }
  async addReview(rating: number, content: string): Promise<Review> {
    const text = this.text(content, 300, 'Góp ý');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw Error('Hãy chọn từ 1 đến 5 sao.');
    const visitor = await this.requireVisitor();
    const review = await this.backend.rpc<Review>('fc_add_review', { p_display_name: visitor.displayName, p_rating: rating, p_content: text });
    this.revision.update(value => value + 1); return review;
  }
  async addComment(playerId: string, content: string): Promise<Comment> {
    this.target({ type: 'player', id: playerId }); const text = this.text(content, 200, 'Bình luận'); const visitor = await this.requireVisitor();
    const comment = await this.backend.rpc<Comment>('fc_add_comment', { p_player_id: playerId, p_display_name: visitor.displayName, p_content: text });
    this.revision.update(value => value + 1); return comment;
  }
  ngOnDestroy() { this.unsubscribe(); }
}
