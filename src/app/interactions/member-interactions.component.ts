import { Component, input } from '@angular/core';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-member-interactions', standalone: true, imports: [IconComponent],
  template: `<span class="member-interaction-counts" aria-hidden="true"><span><app-icon name="heart" />{{ counts()?.hearts ?? '—' }}</span><span><app-icon name="comment" />{{ counts()?.comments ?? '—' }}</span></span>`,
})
export class MemberInteractionsComponent {
  readonly counts = input<{ reactions: number; hearts: number; comments: number }>();
}
