import { Component, ElementRef, HostListener, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { getMembers, getScorers } from '../services/content';
import { PhotoDirective } from './photo.directive';
import { RevealDirective } from './reveal.directive';

@Component({
  selector: 'app-root', standalone: true,
  imports: [PhotoDirective, RevealDirective],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  readonly members = getMembers();
  readonly scoring = getScorers();
  readonly scorers = [...this.scoring.players].sort((a, b) => b.goals - a.goals).map(player => ({
    ...player, image: this.members.find(member => member.id === player.memberId)?.image,
  }));
  readonly totalGoals = this.scorers.reduce((total, player) => total + player.goals, 0);
  readonly topScorer = this.scorers[0];
  readonly selected = signal<number | null>(null);
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
      if (!document.hidden && this.selected() === null && this.featureTouch === null) {
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
  private previousOverflow = '';
  private touchStart: { x: number; y: number } | null = null;

  @ViewChild('closeButton') set closeButton(element: ElementRef<HTMLButtonElement> | undefined) {
    element?.nativeElement.focus();
  }
  get selectedMember() {
    const index = this.selected();
    return index === null ? null : this.members[index];
  }
  open(index: number) {
    this.previousFocus = document.activeElement as HTMLElement;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.selected.set(index);
  }
  close() {
    if (this.selected() === null) return;
    this.selected.set(null);
    document.body.style.overflow = this.previousOverflow;
    this.previousFocus?.focus();
  }
  change(step: number) {
    const index = this.selected();
    if (index !== null) this.selected.set((index + step + this.members.length) % this.members.length);
  }
  @HostListener('document:keydown', ['$event']) onKey(event: KeyboardEvent) {
    if (this.selected() === null) return;
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
    this.touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  endTouch(event: TouchEvent) {
    if (!this.touchStart) return;
    const dx = event.changedTouches[0].clientX - this.touchStart.x;
    const dy = event.changedTouches[0].clientY - this.touchStart.y;
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) this.close();
    else if (Math.abs(dx) > 60) this.change(dx < 0 ? 1 : -1);
    this.touchStart = null;
  }
  submit(event: Event) { event.preventDefault(); this.submitted.set(true); }
  ngOnDestroy() { clearInterval(this.autoTimer); clearTimeout(this.exitTimer); this.close(); }
}
