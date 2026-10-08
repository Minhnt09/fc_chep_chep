import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalStateService {
  private readonly owners = new Set<string>();
  private previousOverflow = '';
  readonly isOpen = signal(false);
  lock(owner: string) {
    if (this.owners.has(owner)) return;
    if (!this.owners.size) { this.previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    this.owners.add(owner); this.isOpen.set(true);
  }
  release(owner: string) {
    if (!this.owners.delete(owner)) return;
    if (!this.owners.size) { document.body.style.overflow = this.previousOverflow; this.isOpen.set(false); }
  }
}
