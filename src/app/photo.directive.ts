import { Directive, HostBinding, HostListener } from '@angular/core';

@Directive({ selector: 'img[appPhoto]', standalone: true })
export class PhotoDirective {
  @HostBinding('class.photo') readonly photo = true;
  @HostBinding('class.loaded') loaded = false;
  @HostListener('load') onLoad() { this.loaded = true; }
}
