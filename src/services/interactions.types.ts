export const REACTION_TYPES = ['football', 'fire', 'applause', 'heart', 'laugh'] as const;
export type ReactionType = typeof REACTION_TYPES[number];
export interface InteractionTarget { type: 'team' | 'player'; id: string; }
export interface Visitor { id: string; displayName: string; }
// Public DTOs deliberately omit visitor UUIDs.
export interface Comment { id: string; playerId: string; displayName: string; content: string; createdAt: string; }
export interface Review { id: string; displayName: string; rating: number; content: string; createdAt: string; }
export interface ReactionSummary { counts: Record<ReactionType, number>; selected: ReactionType[]; total: number; }
export interface Page<T> { items: T[]; total: number; hasMore: boolean; }
export interface TeamStats { count: number; average: number | null; ownReview: Review | null; hasReviewed: boolean; }
export type PlayerStats = Record<string, { reactions: number; comments: number }>;
export const TEAM_TARGET: InteractionTarget = { type: 'team', id: 'fc-chep-chep' };
export const emptyReactionSummary = (): ReactionSummary => ({ counts: { football: 0, fire: 0, applause: 0, heart: 0, laugh: 0 }, selected: [], total: 0 });
export interface InteractionsBackend {
  restoreVisitor(): Promise<Visitor | null>;
  onVisitorChange(callback: (visitor: Visitor | null) => void): () => void;
  saveVisitor(name: string): Promise<Visitor>;
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<T>;
}
