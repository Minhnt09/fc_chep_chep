import { Component, input } from '@angular/core';

type IconName = 'arrow-up-right' | 'arrow-down' | 'arrow-left' | 'arrow-right' | 'expand' | 'close' | 'play' | 'pause' | 'instagram' | 'phone' | 'zalo';

// SVG thuần: hình dạng và màu giống nhau trên iOS/Android, không phụ thuộc font emoji.
@Component({
  selector: 'app-icon',
  standalone: true,
  host: { 'aria-hidden': 'true', '[style.display]': "'inline-flex'" },
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('zalo') { <path fill="currentColor" stroke="none" d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" /> }
        @case ('arrow-up-right') { <path d="M6 18 18 6M6 6h12v12" /> }
        @case ('arrow-down') { <path d="M12 4v16m-6-6 6 6 6-6" /> }
        @case ('arrow-left') { <path d="M20 12H4m6-6-6 6 6 6" /> }
        @case ('arrow-right') { <path d="M4 12h16m-6-6 6 6-6 6" /> }
        @case ('expand') { <path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" /> }
        @case ('close') { <path d="m6 6 12 12M18 6 6 18" /> }
        @case ('play') { <path d="m9 5 11 7-11 7V5Z" /> }
        @case ('pause') { <path d="M9 5v14m6-14v14" /> }
        @case ('instagram') { <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" /> }
        @case ('phone') { <path d="m7 3 3 5-2.5 2a16 16 0 0 0 6.5 6.5l2-2.5 5 3-1 3c-.3.8-1.1 1.2-2 1C9.8 19.4 4.6 14.2 3 6c-.2-.9.2-1.7 1-2l3-1Z" /> }
      }
    </svg>
  `,
  styles: [`:host { width: 20px; height: 20px; flex: 0 0 auto; vertical-align: middle; } svg { width: 100%; height: 100%; display: block; }`],
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
