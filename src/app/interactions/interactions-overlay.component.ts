import { Component, ElementRef, HostListener, OnDestroy, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { Comment, InteractionsService, Review } from '../../services/interactions.service';
import { IconComponent } from '../icon.component';
import { InteractionSheet, InteractionUiService } from './interaction-ui.service';
import { ModalStateService } from './modal-state.service';

@Component({
  selector: 'app-interactions-overlay', standalone: true, imports: [IconComponent],
  templateUrl: './interactions-overlay.component.html',
})
export class InteractionsOverlayComponent implements OnDestroy {
  readonly service = inject(InteractionsService);
  readonly ui = inject(InteractionUiService);
  private readonly modal = inject(ModalStateService);
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  readonly name = signal('');
  readonly draft = signal('');
  readonly rating = signal(0);
  readonly saving = signal(false);
  readonly nameError = signal('');
  readonly ratingError = signal('');
  readonly contentError = signal('');
  readonly error = signal('');
  readonly notice = signal('');
  readonly ownReview = signal<Review | null>(null);
  readonly reviewLoading = signal(false);
  readonly reviewLoadError = signal('');
  readonly hasReviewed = signal(false);
  readonly commentsLoadError = signal('');
  readonly comments = signal<Comment[]>([]);
  readonly hasMore = signal(false);
  readonly commentsLoading = signal(false);
  readonly loadingMore = signal(false);
  readonly viewportHeight = signal(window.visualViewport?.height ?? window.innerHeight);
  readonly keyboardInset = signal(0);
  readonly stars = [1, 2, 3, 4, 5];
  private requestId = 0;
  private animationFrame = 0;
  private drag: { x: number; y: number } | null = null;
  private readonly onViewport = () => {
    const viewport = window.visualViewport;
    this.viewportHeight.set(viewport?.height ?? window.innerHeight);
    this.keyboardInset.set(Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0)));
  };
  constructor() {
    window.visualViewport?.addEventListener('resize', this.onViewport);
    window.visualViewport?.addEventListener('scroll', this.onViewport);
    effect(() => {
      const sheet = this.ui.sheet(); const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      cancelAnimationFrame(this.animationFrame);
      if (sheet) {
        this.modal.lock('interaction'); untracked(() => this.init(sheet));
        if (!dialog.open) dialog.showModal();
        this.animationFrame = requestAnimationFrame(() => {
          if (this.ui.sheet() === sheet) dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
        });
      } else {
        this.requestId++; if (dialog.open) dialog.close(); this.modal.release('interaction'); this.ui.restoreFocus();
      }
    });
    effect(() => {
      this.service.revision(); const sheet = this.ui.sheet();
      if (sheet?.mode === 'comments') untracked(() => { void this.refreshComments(sheet.playerId); });
    });
  }
  private init(sheet: InteractionSheet) {
    this.requestId++; this.name.set(this.service.visitor()?.displayName ?? ''); this.draft.set(''); this.rating.set(0);
    this.nameError.set(''); this.contentError.set(''); this.ratingError.set(''); this.error.set(''); this.notice.set('');
    this.comments.set([]); this.hasMore.set(false); this.ownReview.set(null); this.hasReviewed.set(false); this.reviewLoadError.set(''); this.commentsLoadError.set('');
    if (sheet.mode === 'review') {
      this.reviewLoading.set(true); const request = this.requestId;
      void this.service.getTeamStats().then(stats => { if (request === this.requestId) { this.ownReview.set(stats.ownReview); this.hasReviewed.set(stats.hasReviewed); } })
        .catch(error => { if (request === this.requestId) this.reviewLoadError.set(this.message(error)); })
        .finally(() => { if (request === this.requestId) this.reviewLoading.set(false); });
    }
  }
  updateName(event: Event) { this.name.set((event.target as HTMLInputElement).value); this.nameError.set(''); }
  updateDraft(event: Event) { this.draft.set((event.target as HTMLTextAreaElement).value); this.contentError.set(''); }
  selectRating(value: number) { this.rating.set(value); this.ratingError.set(''); }
  ratingKey(event: KeyboardEvent, value: number) {
    if (!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const next = event.key === 'Home' ? 1 : event.key === 'End' ? 5 : Math.max(1, Math.min(5, value + (['ArrowRight','ArrowUp'].includes(event.key) ? 1 : -1)));
    this.selectRating(next); this.dialog()?.nativeElement.querySelector<HTMLButtonElement>(`[data-rating="${next}"]`)?.focus();
  }
  private validateContent(max: number) {
    const content = this.draft().trim();
    this.contentError.set(!content ? 'Hãy viết một lời nhắn trước khi gửi.' : content.length > max ? `Nội dung tối đa ${max} ký tự.` : '');
    return !this.contentError();
  }
  async submitIdentity(event: Event) {
    event.preventDefault(); if (this.saving()) return;
    const name = this.name().trim();
    if (!name || name.length > 30) { this.nameError.set('Tên hiển thị cần có từ 1 đến 30 ký tự.'); return; }
    this.saving.set(true); this.error.set('');
    try { await this.service.saveVisitor(name); await this.ui.finishIdentity(); }
    catch (error) { this.error.set(this.message(error)); }
    finally { this.saving.set(false); }
  }
  async submitReview(event: Event) {
    event.preventDefault(); if (this.saving() || this.reviewLoading() || this.reviewLoadError() || this.hasReviewed()) return;
    const valid = this.validateContent(300);
    this.ratingError.set(this.rating() < 1 || this.rating() > 5 ? 'Hãy chọn điểm từ 1 đến 5 sao.' : '');
    if (!valid || this.ratingError()) return;
    this.saving.set(true); this.error.set('');
    try { const review = await this.service.addReview(this.rating(), this.draft()); this.ownReview.set(review); this.hasReviewed.set(true); this.notice.set('Đã gửi đánh giá. Cảm ơn lời góp ý của bạn!'); }
    catch (error) { this.error.set(this.message(error)); }
    finally { this.saving.set(false); }
  }
  submitComment(event: Event, playerId: string, playerName: string) {
    event.preventDefault(); if (this.saving() || !this.validateContent(200)) return;
    const content = this.draft().trim(); this.error.set('');
    void this.ui.withVisitor(async () => {
      if (this.ui.sheet()?.mode !== 'comments') this.ui.openComments(playerId, playerName);
      await this.saveComment(playerId, content);
    });
  }
  private async saveComment(playerId: string, content: string) {
    this.saving.set(true); this.error.set(''); this.notice.set('');
    try {
      await this.service.addComment(playerId, content);
      this.draft.set(''); this.notice.set('Đã gửi bình luận.');
    } catch (error) { this.draft.set(content); this.error.set(this.message(error)); }
    finally { this.saving.set(false); }
  }
  private async refreshComments(playerId: string) {
    const request = ++this.requestId; if (!this.comments().length) this.commentsLoading.set(true);
    try {
      const page = await this.service.listComments(playerId, 0, 5);
      if (request !== this.requestId) return;
      this.comments.set(page.items); this.hasMore.set(page.hasMore); this.commentsLoadError.set('');
    } catch (error) { if (request === this.requestId) this.commentsLoadError.set(this.message(error)); }
    finally { if (request === this.requestId) this.commentsLoading.set(false); }
  }
  retryComments(playerId: string) { void this.refreshComments(playerId); }
  async moreComments(playerId: string) {
    if (this.loadingMore()) return;
    this.loadingMore.set(true); const request = this.requestId;
    try {
      const page = await this.service.listComments(playerId, this.comments().length, 5);
      if (request !== this.requestId) return;
      this.comments.update(items => [...items, ...page.items.filter(item => !items.some(old => old.id === item.id))]); this.hasMore.set(page.hasMore);
    } catch { this.error.set('Chưa tải được thêm bình luận. Hãy thử lại.'); }
    finally { this.loadingMore.set(false); }
  }
  private message(error: unknown) { return error instanceof Error ? error.message : 'Chưa lưu được. Nội dung vẫn được giữ để bạn thử lại.'; }
  close() { if (!this.saving()) this.ui.close(); }
  cancel(event: Event) { event.preventDefault(); this.close(); }
  backdrop(event: MouseEvent) {
    if (event.target !== this.dialog()?.nativeElement) return;
    const bounds = this.dialog()!.nativeElement.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.close();
  }
  startDrag(event: TouchEvent) { this.drag = { x: event.touches[0].clientX, y: event.touches[0].clientY }; event.stopPropagation(); }
  endDrag(event: TouchEvent) {
    event.stopPropagation(); if (!this.drag) return;
    const dy = event.changedTouches[0].clientY - this.drag.y; const dx = event.changedTouches[0].clientX - this.drag.x;
    if (dy > 70 && dy > Math.abs(dx)) this.close(); this.drag = null;
  }
  @HostListener('document:keydown', ['$event']) key(event: KeyboardEvent) {
    if (!this.ui.sheet()) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(); }
    if (event.key === 'Tab') {
      const controls = Array.from(this.dialog()!.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]'))
        .filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0);
      if (!controls.length) return;
      const current = controls.indexOf(document.activeElement as HTMLElement);
      const next = current < 0 ? (event.shiftKey ? controls.length - 1 : 0) : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      event.preventDefault(); controls[next].focus();
    }
  }
  formatTime(date: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date)); }
  ngOnDestroy() {
    this.requestId++; cancelAnimationFrame(this.animationFrame);
    window.visualViewport?.removeEventListener('resize', this.onViewport); window.visualViewport?.removeEventListener('scroll', this.onViewport);
    this.dialog()?.nativeElement.close(); this.modal.release('interaction');
  }
}
