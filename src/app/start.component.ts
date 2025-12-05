import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="start-screen">
      <h1 class="title">World Quiz</h1>
      <div class="start-row">
        <div class="start-col">
          <h2>Players</h2>
          <div class="start-group">
            <button class="action-btn" [class.active]="players===2" (click)="players=2">2</button>
            <button class="action-btn" [class.active]="players===3" (click)="players=3">3</button>
            <button class="action-btn" [class.active]="players===4" (click)="players=4">4</button>
          </div>
        </div>
        <div class="start-col">
          <h2>Difficulty</h2>
          <div class="start-group">
            <button class="action-btn" [class.active]="difficulty==='easy'" (click)="difficulty='easy'">Easy</button>
            <button class="action-btn" [class.active]="difficulty==='medium'" (click)="difficulty='medium'">Medium</button>
            <button class="action-btn" [class.active]="difficulty==='hard'" (click)="difficulty='hard'">Hard</button>
          </div>
          <p class="start-note">Easy: pick freely • Medium: alternates pick/random • Hard: dice only</p>
        </div>
        <div class="start-col">
          <h2>Timer</h2>
          <div class="start-group">
            <button class="action-btn" [class.active]="minutes===15" (click)="minutes=15">15 min</button>
            <label class="timer-input">
              <span>Custom (min)</span>
              <input type="number" min="1" [(ngModel)]="minutes" />
            </label>
          </div>
        </div>
      </div>
      <div class="start-actions">
        <button class="action-btn primary" (click)="confirm()">Start Game</button>
      </div>
    </div>
  `,
  styles: [`
    .start-screen { min-height: 100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2rem; background: radial-gradient(1200px 600px at 20% 20%, rgba(239,68,68,0.35), transparent), radial-gradient(900px 400px at 80% 80%, rgba(34,197,94,0.35), transparent); }
    .title { font-size: 2rem; font-weight: 800; color:#fff; }
    .start-row { display:flex; gap:2rem; }
    .start-col { display:flex; flex-direction:column; gap:0.75rem; color:#fff; }
    .start-group { display:flex; gap:0.5rem; align-items:center; }
    .start-note { color:#9ca3af; font-size:0.875rem; }
    .timer-input { display:flex; gap:0.5rem; align-items:center; }
    .timer-input input { width:100px; padding:0.5rem; background:#0b1220; color:#fff; border:1px solid #334155; border-radius:0.5rem; }
    .start-actions { display:flex; gap:0.75rem; }
    .action-btn { background:#0b1220; color:#fff; border:1px solid #334155; padding:0.75rem 1rem; border-radius:0.75rem; cursor:pointer; }
    .action-btn.primary { background:#dc2626; border-color:#991b1b; }
    .action-btn.active { background:#1f2937; border-color:#dc2626; box-shadow: 0 0 0 2px #dc2626 inset; }
  `]
})
export class StartComponent {
  players: 2|3|4 = 2;
  difficulty: 'easy'|'medium'|'hard' = 'easy';
  minutes = 15;

  constructor(private router: Router) {}

  confirm(): void {
    const settings = { players: this.players, difficulty: this.difficulty, minutes: Math.max(1, Math.floor(this.minutes)) };
    try { localStorage.setItem('gameSettings', JSON.stringify(settings)); } catch {}
    this.router.navigate(['/game']);
  }
}
