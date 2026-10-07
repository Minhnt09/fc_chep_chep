import { AfterViewInit, Directive, ElementRef, inject, OnDestroy } from '@angular/core';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements AfterViewInit, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  ngAfterViewInit() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const element = this.element.nativeElement;
    element.classList.add('reveal');
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        element.classList.add('revealed');
        this.observer?.disconnect();
      }
    }, { threshold: 0.1 });
    this.observer.observe(element);
  }
  ngOnDestroy() { this.observer?.disconnect(); }
}
