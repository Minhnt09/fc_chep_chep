import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { getMembers, getScorers, getMatches, getNews } from '../services/content';
import { InteractionsService, PlayerStats } from '../services/interactions.service';
import { InteractionUiService } from './interactions/interaction-ui.service';
import { ModalStateService } from './interactions/modal-state.service';
import { TeamInteractionsComponent } from './interactions/team-interactions.component';
import { ReactionBarComponent } from './interactions/reaction-bar.component';
import { MemberInteractionsComponent } from './interactions/member-interactions.component';
import { InteractionsOverlayComponent } from './interactions/interactions-overlay.component';
import { IconComponent } from './icon.component';
import { PhotoDirective } from './photo.directive';
import { RevealDirective } from './reveal.directive';

@Component({
  selector: 'app-root', standalone: true,
  imports: [PhotoDirective, RevealDirective, IconComponent, TeamInteractionsComponent, ReactionBarComponent, MemberInteractionsComponent, InteractionsOverlayComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly members = getMembers();
  readonly interactionUi = inject(InteractionUiService);
  readonly modal = inject(ModalStateService);
  readonly interactions = inject(InteractionsService);
  readonly playerStats = signal<PlayerStats>({});
  readonly rankedMembers = computed(() => this.members.map((member, originalIndex) => ({ ...member, originalIndex }))
    .sort((a, b) => (this.playerStats()[b.id]?.hearts ?? 0) - (this.playerStats()[a.id]?.hearts ?? 0) || a.originalIndex - b.originalIndex));
  private playerStatsRequest = 0;
  constructor() {
    effect(() => {
      this.interactions.revision(); const request = ++this.playerStatsRequest;
      void this.interactions.getPlayerStats().then(stats => { if (request === this.playerStatsRequest) this.playerStats.set(stats); })
        .catch(() => { /* The fan section reports connection errors; keep the rest of the page usable. */ });
    });
  }
  readonly news = getNews();
  readonly upcomingMatches = getMatches().filter(match => match.status === 'upcoming')
    .map(match => ({ ...match, displayDate: match.date ?? '', venue: match.venue as string | null }))
    .sort((a, b) => (a.kickoff ?? a.displayDate).localeCompare(b.kickoff ?? b.displayDate));
  readonly historyMatches = getMatches().filter((match): match is typeof match & { scoreFor: number; scoreAgainst: number } =>
    match.status === 'played' && typeof match.scoreFor === 'number' && typeof match.scoreAgainst === 'number'
    && (typeof match.date === 'string' || typeof match.postedAt === 'string')).map(match => ({
    ...match,
    displayDate: match.date ?? match.postedAt ?? '',
    result: match.scoreFor > match.scoreAgainst ? 'win' : match.scoreFor < match.scoreAgainst ? 'loss' : 'draw',
  })).sort((a, b) => b.displayDate.localeCompare(a.displayDate));
  readonly historyResult = signal('all');
  readonly historyMonth = signal('all');
  readonly matchCounts = {
    all: this.historyMatches.length,
    win: this.historyMatches.filter(match => match.result === 'win').length,
    draw: this.historyMatches.filter(match => match.result === 'draw').length,
    loss: this.historyMatches.filter(match => match.result === 'loss').length,
  };
  readonly historyFilters = [
    { id: 'all', label: 'Tất cả', count: this.matchCounts.all },
    { id: 'win', label: 'Thắng', count: this.matchCounts.win },
    { id: 'draw', label: 'Hòa', count: this.matchCounts.draw },
    { id: 'loss', label: 'Thua', count: this.matchCounts.loss },
  ];
  readonly historyMonths = [...new Set(this.historyMatches.map(match => match.displayDate.slice(0, 7)))];
  readonly historyGroups = computed(() => {
    const filtered = this.historyMatches.filter(match =>
      (this.historyResult() === 'all' || match.result === this.historyResult()) &&
      (this.historyMonth() === 'all' || match.displayDate.startsWith(this.historyMonth())));
    return [...new Set(filtered.map(match => match.displayDate.slice(0, 7)))].map(month => ({
      month, matches: filtered.filter(match => match.displayDate.startsWith(month)),
    }));
  });
  readonly hasUnverifiedMatchDates = this.historyMatches.some(match => !match.dateVerified);
  setHistoryMonth(event: Event) { this.historyMonth.set((event.target as HTMLSelectElement).value); }
  formatMonth(month: string) { const [year, number] = month.split('-'); return `Tháng ${Number(number)} / ${year}`; }
  formatDate(date: string) { return date.split('-').reverse().join('/'); }
  resultLabel(result: string) { return result === 'win' ? 'Thắng' : result === 'loss' ? 'Thua' : 'Hòa'; }

  readonly scoring = getScorers();
  readonly scorers = [...this.scoring.players].sort((a, b) => b.goals - a.goals).map(player => ({
    ...player, image: this.members.find(member => member.id === player.memberId)?.image,
  }));
  readonly totalGoals = this.scorers.reduce((total, player) => total + player.goals, 0);
  readonly topScorer = this.scorers[0];
  readonly selected = signal<number | null>(null);
  readonly showStickyContact = signal(false);
  private contactObserver?: IntersectionObserver;

  ngAfterViewInit() {
    const visible = new Set<string>();
    this.contactObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      // Hero đã có CTA; không che controls, lịch thi đấu hoặc form liên hệ.
      this.showStickyContact.set(visible.size === 0);
    }, { rootMargin: '0px 0px -72px 0px' });
    for (const id of ['home', 'spotlight', 'news', 'contact']) {
      const section = document.getElementById(id);
      if (section) this.contactObserver.observe(section);
    }
    document.querySelectorAll('.fixture-panel').forEach(fixture => this.contactObserver!.observe(fixture));
  }

  readonly submitted = signal(false);
  readonly featured = signal(1);
  readonly outgoing = signal<number | null>(null);
  readonly slideDirection = signal(1);
  readonly autoplay = signal(true);
  private featureTouch: number | null = null;
  private autoTimer?: ReturnType<typeof setInterval>;
  private exitTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.autoplay.set(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.startAutoplay();
  }
  private startAutoplay() {
    clearInterval(this.autoTimer);
    if (!this.autoplay() || this.members.length < 2) return;
    this.autoTimer = setInterval(() => {
      if (!document.hidden && !this.modal.isOpen() && this.selected() === null && this.featureTouch === null) {
        this.advanceFeatured(this.slideDirection());
      }
    }, 2000);
  }
  private advanceFeatured(step: number) {
    // Không chồng chuyển cảnh nếu chạm liên tiếp.
    if (this.outgoing() !== null) return;
    this.slideDirection.set(step < 0 ? -1 : 1);
    this.outgoing.set(this.featured());
    this.featured.update(index => (index + step + this.members.length) % this.members.length);
    this.exitTimer = setTimeout(() => this.outgoing.set(null), 400);
  }
  changeFeatured(step: number) {
    this.advanceFeatured(step);
    this.startAutoplay();
  }
  toggleAutoplay() {
    this.autoplay.update(active => !active);
    this.startAutoplay();
  }
  startFeatureTouch(event: TouchEvent) { this.featureTouch = event.touches[0].clientX; }
  endFeatureTouch(event: TouchEvent) {
    if (this.featureTouch === null) return;
    const dx = event.changedTouches[0].clientX - this.featureTouch;
    if (Math.abs(dx) > 60) this.changeFeatured(dx < 0 ? 1 : -1);
    this.featureTouch = null;
  }
  private previousFocus: HTMLElement | null = null;
  private touchStart: { x: number; y: number } | null = null;

  @ViewChild('closeButton') set closeButton(element: ElementRef<HTMLButtonElement> | undefined) {
    element?.nativeElement.focus();
  }
  get selectedMember() {
    const index = this.selected();
    return index === null ? null : this.members[index];
  }
  open(index: number, event?: Event) {
    this.previousFocus = event?.currentTarget instanceof HTMLElement ? event.currentTarget : document.activeElement as HTMLElement;
    this.modal.lock('player');
    this.selected.set(index);
  }
  close() {
    if (this.selected() === null) return;
    this.selected.set(null);
    this.modal.release('player');
    this.previousFocus?.focus();
  }
  change(step: number) {
    const index = this.selected();
    if (index !== null) this.selected.set((index + step + this.members.length) % this.members.length);
  }
  @HostListener('document:keydown', ['$event']) onKey(event: KeyboardEvent) {
    if (event.defaultPrevented || this.selected() === null || this.interactionUi.sheet()) return;
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowRight') { event.preventDefault(); this.change(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); this.change(-1); }
    if (event.key === 'Tab') {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.lightbox button'));
      const next = (buttons.indexOf(document.activeElement as HTMLButtonElement) + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      event.preventDefault(); buttons[next]?.focus();
    }
  }
  startTouch(event: TouchEvent) {
    if (this.interactionUi.sheet()) return;
    this.touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  endTouch(event: TouchEvent) {
    if (!this.touchStart || this.interactionUi.sheet()) return;
    const dx = event.changedTouches[0].clientX - this.touchStart.x;
    const dy = event.changedTouches[0].clientY - this.touchStart.y;
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) this.close();
    else if (Math.abs(dx) > 60) this.change(dx < 0 ? 1 : -1);
    this.touchStart = null;
  }
  submit(event: Event) { event.preventDefault(); this.submitted.set(true); }
  ngOnDestroy() { this.playerStatsRequest++; this.contactObserver?.disconnect(); clearInterval(this.autoTimer); clearTimeout(this.exitTimer); this.close(); }
}
