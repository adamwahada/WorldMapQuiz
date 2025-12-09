import { Component } from '@angular/core';
import { GameEntryComponent } from './components/game-entry.component';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterOutlet],
  template: `
    <h1>World Quiz</h1>
    <router-outlet></router-outlet>
  `,
})
export class RootComponent {}
