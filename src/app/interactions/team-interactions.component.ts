import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { InteractionsService, Review, TeamStats } from '../../services/interactions.service';
import { IconComponent } from '../icon.component';
import { ReactionBarComponent } from './reaction-bar.component';
import { InteractionUiService } from './interaction-ui.service';

@Component({
  selector: 'app-team-interactions', standalone: true, imports: [IconComponent, ReactionBarComponent],
  template: `
    <section class="fan-section" id="fan-zone" aria-labelledby="fan-title">
      <div class="fan-intro"><div><span class="eyebrow">TỪ KHÁN ĐÀI / ĐẾN ANH EM</span><h2 id="fan-title">Một lời cổ vũ.<br/><em>Thêm một động lực.</em></h2></div>
        <button type="button" class="fan-identity" (click)="ui.changeName($event)">{{ service.visitor()?.displayName ?? 'Tên của bạn' }} <span>{{ service.visitor() ? 'Đổi tên' : 'Đặt tên' }}</span></button>
      </div>
      <div class="fan-actions"><div class="fan-reactions"><p>Gửi một chút năng lượng cho đội.</p><app-reaction-bar targetId="fc-chep-chep" targetName="FC Chẹp Chẹp" /></div>
        <div class="fan-rating"><div class="rating-overview"><app-icon name="star" [filled]="stats().count > 0" />
          @if (loading()) {<span role="status">Đang tải đánh giá…</span>}
          @else if (error()) {<span>Chưa tải được đánh giá.</span>}
          @else if (stats().average !== null) {<strong>{{ stats().average!.toFixed(1) }}<small>/5</small></strong><span>{{ stats().count }} lượt đánh giá</span>}
          @else {<span>Chưa có đánh giá.<br/><small>Góp ý đầu tiên từ bạn?</small></span>}
        </div><button type="button" class="fan-review-button" (click)="ui.openReview($event)">{{ stats().hasReviewed ? 'Đánh giá của bạn' : 'Đánh giá đội' }}<app-icon name="arrow-up-right" /></button></div>
      </div>
      <p class="interaction-local-note">Lời cổ vũ được chia sẻ cùng mọi người. Không cần đăng ký.</p>
      @if (ui.error()) {<p class="interaction-error" role="alert">{{ ui.error() }}</p>}
      @if (service.sessionWarning()) {<p class="interaction-error" role="status">{{ service.sessionWarning() }}</p>}
      <div class="fan-reviews"><div class="fan-reviews-heading"><h3>Lời nhắn từ khán đài</h3><span>{{ stats().count }} GÓP Ý</span></div>
        @if (loading()) {<p class="interaction-empty" role="status">Đang tải góp ý…</p>}
        @else if (!error()) { @for (review of reviews(); track review.id) {
          <article class="fan-review-card"><div class="interaction-entry-heading"><strong>{{ review.displayName }}</strong><time [attr.datetime]="review.createdAt">{{ formatTime(review.createdAt) }}</time></div>
            <div class="entry-stars" [attr.aria-label]="review.rating + ' trên 5 sao'">@for (star of stars; track star) {<app-icon name="star" [filled]="star <= review.rating" />}</div><p>{{ review.content }}</p></article>
        } @empty {<p class="interaction-empty">Chưa có lời nhắn. Một góp ý chân thành luôn được chào đón.</p>} }
        @if (hasMore()) {<button type="button" class="text-button" [disabled]="loadingMore()" (click)="more()">{{ loadingMore() ? 'Đang tải…' : 'Xem thêm góp ý' }}<app-icon name="arrow-down" /></button>}
        @if (error()) {<p class="interaction-error" role="alert">{{ error() }}</p><button type="button" class="text-button" (click)="retry()">Thử tải lại<app-icon name="arrow-right" /></button>}
      </div>
    </section>
  `,
})
export class TeamInteractionsComponent implements OnDestroy {
  readonly service = inject(InteractionsService);
  readonly ui = inject(InteractionUiService);
  readonly stats = signal<TeamStats>({ count: 0, average: null, ownReview: null, hasReviewed: false });
  readonly reviews = signal<Review[]>([]);
  readonly hasMore = signal(false);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  readonly stars = [1, 2, 3, 4, 5];
  private requestId = 0;
  constructor() {
    effect(() => { this.service.revision(); void this.refresh(); });
  }
  private async refresh() {
    const request = ++this.requestId;
    try {
      const [stats, page] = await Promise.all([this.service.getTeamStats(), this.service.listReviews(0, 5)]);
      if (request !== this.requestId) return;
      this.stats.set(stats); this.reviews.set(page.items); this.hasMore.set(page.hasMore); this.error.set('');
    } catch (error) { if (request === this.requestId) this.error.set(error instanceof Error ? error.message : 'Chưa tải được góp ý. Hãy thử lại.'); }
    finally { if (request === this.requestId) this.loading.set(false); }
  }
  retry() { this.loading.set(true); void this.refresh(); this.service.revision.update(value => value + 1); }
  async more() {
    if (this.loadingMore()) return;
    this.loadingMore.set(true); const request = this.requestId;
    try {
      const page = await this.service.listReviews(this.reviews().length, 5);
      if (request !== this.requestId) return;
      this.reviews.update(items => [...items, ...page.items.filter(item => !items.some(old => old.id === item.id))]); this.hasMore.set(page.hasMore);
    } catch { this.error.set('Chưa tải được thêm góp ý. Hãy thử lại.'); }
    finally { this.loadingMore.set(false); }
  }
  formatTime(date: string) { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date)); }
  ngOnDestroy() { this.requestId++; }
}
