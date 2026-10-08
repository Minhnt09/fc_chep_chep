import { Injectable, inject, signal } from '@angular/core';
import { InteractionsService } from '../../services/interactions.service';

export type InteractionSheet = { mode: 'identity'; changing: boolean } | { mode: 'review' } | { mode: 'comments'; playerId: string; playerName: string };
@Injectable({ providedIn: 'root' })
export class InteractionUiService {
  private readonly interactions = inject(InteractionsService);
  readonly sheet = signal<InteractionSheet | null>(null);
  readonly error = signal('');
  private pending: (() => void | Promise<void>) | null = null;
  private returnFocus: HTMLElement | null = null;
  private checkingVisitor = false;
  present(sheet: InteractionSheet, opener?: HTMLElement) {
    if (!this.sheet()) this.returnFocus = opener ?? document.activeElement as HTMLElement;
    this.sheet.set(sheet);
  }
  async withVisitor(action: () => void | Promise<void>, opener?: HTMLElement) {
    if (this.checkingVisitor) return;
    this.checkingVisitor = true;
    this.error.set('');
    try {
      const visitor = await this.interactions.getVisitor();
      if (visitor) { await action(); return; }
      this.pending = action; this.present({ mode: 'identity', changing: false }, opener);
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Chưa đọc được phiên truy cập. Hãy thử lại.'); }
    finally { this.checkingVisitor = false; }
  }
  private opener(event?: Event) { return event?.currentTarget instanceof HTMLElement ? event.currentTarget : undefined; }
  openReview(event?: Event) { const opener = this.opener(event); this.withVisitor(() => this.present({ mode: 'review' }, opener), opener); }
  openComments(playerId: string, playerName: string, event?: Event) { this.present({ mode: 'comments', playerId, playerName }, this.opener(event)); }
  changeName(event?: Event) { this.pending = null; this.present({ mode: 'identity', changing: !!this.interactions.visitor() }, this.opener(event)); }
  async finishIdentity() {
    const action = this.pending; this.pending = null;
    if (action) await action();
    if (this.sheet()?.mode === 'identity') this.close();
  }
  close() { this.pending = null; this.sheet.set(null); }
  restoreFocus() { if (this.returnFocus?.isConnected) this.returnFocus.focus(); this.returnFocus = null; }
}
