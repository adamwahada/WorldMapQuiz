import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-active-session-toast',
  template: `
    <div class="active-session-toast" [class.show]="visible">
      <p>You already have an active session ({{ sessionCode }}).</p>
      <div class="toast-actions">
        <button class="btn-netflix primary small" (click)="join.emit()">Join</button>
        <button class="btn-netflix secondary small" (click)="quit.emit()">Quit</button>
        <button class="btn-netflix secondary small" (click)="showModal.emit()">More Options</button>
      </div>
      <button class="toast-close" (click)="closeToast()">✕</button>
    </div>
  `,
  styles: [`
    .active-session-toast {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: #141414;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
      z-index: 1000;
      width: 280px;
    }
    .active-session-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    .toast-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
    }
    .toast-close {
      position: absolute;
      top: 4px;
      right: 6px;
      background: transparent;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
    }
  `]
})
export class ActiveSessionToastComponent {
  @Input() sessionCode: string = '';
  @Input() visible: boolean = false;

  @Output() join = new EventEmitter<void>();
  @Output() quit = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() showModal = new EventEmitter<void>();

  closeToast() {
    this.visible = false;
    this.close.emit();
  }
}
