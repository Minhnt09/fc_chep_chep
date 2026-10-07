import { Component, input } from '@angular/core';

type IconName = 'arrow-up-right' | 'arrow-down' | 'arrow-left' | 'arrow-right' | 'expand' | 'close' | 'play' | 'pause';

// SVG thuần: hình dạng và màu giống nhau trên iOS/Android, không phụ thuộc font emoji.
@Component({
  selector: 'app-icon',
  standalone: true,
  host: { 'aria-hidden': 'true', '[style.display]': "'inline-flex'" },
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('arrow-up-right') { <path d="M6 18 18 6M6 6h12v12" /> }
        @case ('arrow-down') { <path d="M12 4v16m-6-6 6 6 6-6" /> }
        @case ('arrow-left') { <path d="M20 12H4m6-6-6 6 6 6" /> }
        @case ('arrow-right') { <path d="M4 12h16m-6-6 6 6-6 6" /> }
        @case ('expand') { <path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" /> }
        @case ('close') { <path d="m6 6 12 12M18 6 6 18" /> }
        @case ('play') { <path d="m9 5 11 7-11 7V5Z" /> }
        @case ('pause') { <path d="M9 5v14m6-14v14" /> }
      }
    </svg>
  `,
  styles: [`:host { width: 20px; height: 20px; flex: 0 0 auto; vertical-align: middle; } svg { width: 100%; height: 100%; display: block; }`],
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
