import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { InteractionsService, InteractionTarget, ReactionType, emptyReactionSummary } from '../../services/interactions.service';
import { IconComponent } from '../icon.component';
import { InteractionUiService } from './interaction-ui.service';

@Component({
  selector: 'app-reaction-bar', standalone: true, imports: [IconComponent],
  host: { '(touchstart)': '$event.stopPropagation()', '(touchend)': '$event.stopPropagation()' },
  template: `
    <div class="reaction-row" role="group" [attr.aria-label]="'Cảm xúc dành cho ' + targetName()">
      @for (reaction of reactions; track reaction.type) {
        <button type="button" class="reaction-pill" [class.chosen]="summary().selected.includes(reaction.type)"
          [class.reaction-burst]="burst() === reaction.type" [disabled]="pending().length > 0 || loading() || !!loadError()"
          [attr.aria-pressed]="summary().selected.includes(reaction.type)"
          [attr.aria-label]="reaction.label + ' dành cho ' + targetName() + ': ' + summary().counts[reaction.type]"
          (click)="choose(reaction.type, $event)">
          <app-icon [name]="reaction.type" /><span>{{ loading() || loadError() ? '—' : summary().counts[reaction.type] }}</span>
        </button>
      }
    </div>
    @if (loading()) { <p class="interaction-local-note" role="status">Đang tải cảm xúc…</p> }
    @if (error()) { <p class="interaction-error" role="alert">{{ error() }}</p> }
    @if (loadError()) { <p class="interaction-error" role="alert">{{ loadError() }}</p> }
  `,
})
export class ReactionBarComponent implements OnDestroy {
  readonly service = inject(InteractionsService);
  private readonly ui = inject(InteractionUiService);
  readonly targetType = input<'team' | 'player'>('team');
  readonly targetId = input.required<string>();
  readonly targetName = input.required<string>();
  private readonly target = computed<InteractionTarget>(() => ({ type: this.targetType(), id: this.targetId() }));
  readonly summary = signal(emptyReactionSummary());
  readonly pending = signal<ReactionType[]>([]);
  readonly burst = signal<ReactionType | null>(null);
  readonly error = signal('');
  readonly loadError = signal('');
  readonly loading = signal(true);
  readonly reactions: { type: ReactionType; label: string }[] = [
    { type: 'football', label: 'Bóng đá' }, { type: 'fire', label: 'Bùng cháy' },
    { type: 'applause', label: 'Vỗ tay' }, { type: 'heart', label: 'Yêu thích' }, { type: 'laugh', label: 'Vui vẻ' },
  ];
  private loadId = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private destroyed = false;
  constructor() {
    effect(() => {
      const target = this.target(); this.service.revision();
      const request = ++this.loadId;
      if (this.pending().length) return;
      this.loading.set(true);
      void this.service.getReactionSummary(target).then(summary => {
        if (!this.destroyed && request === this.loadId) { this.summary.set(summary); this.loadError.set(''); }
      }).catch(error => { if (!this.destroyed && request === this.loadId) this.loadError.set(error instanceof Error ? error.message : 'Chưa tải được cảm xúc. Hãy thử lại.'); })
        .finally(() => { if (!this.destroyed && request === this.loadId) this.loading.set(false); });
    });
  }
  choose(type: ReactionType, event: Event) {
    const target = this.target();
    void this.ui.withVisitor(() => this.toggle(target, type), event.currentTarget as HTMLElement);
  }
  private optimistic(type: ReactionType, selected: boolean) {
    this.summary.update(summary => ({
      counts: { ...summary.counts, [type]: Math.max(0, summary.counts[type] + (selected ? 1 : -1)) },
      selected: selected ? [...new Set([...summary.selected, type])] : summary.selected.filter(item => item !== type),
      total: Math.max(0, summary.total + (selected ? 1 : -1)),
    }));
  }
  private async toggle(target: InteractionTarget, type: ReactionType) {
    if (this.destroyed || this.pending().includes(type)) return;
    const before = this.summary(); const wasSelected = before.selected.includes(type);
    this.pending.update(items => [...items, type]); this.error.set(''); this.optimistic(type, !wasSelected);
    if (!wasSelected) {
      clearTimeout(this.timer); this.burst.set(type);
      this.timer = setTimeout(() => this.burst.set(null), 350);
    }
    const currentTarget = () => this.target().id === target.id && this.target().type === target.type;
    try { const summary = await this.service.toggleReaction(target, type, !wasSelected); if (!this.destroyed && currentTarget()) this.summary.set(summary); }
    catch (error) {
      if (!this.destroyed && currentTarget()) { this.summary.set(before); this.error.set(error instanceof Error ? error.message : 'Chưa lưu được cảm xúc. Hãy thử lại.'); }
    } finally { if (!this.destroyed) this.pending.update(items => items.filter(item => item !== type)); }
  }
  ngOnDestroy() { this.destroyed = true; this.loadId++; clearTimeout(this.timer); }
}
