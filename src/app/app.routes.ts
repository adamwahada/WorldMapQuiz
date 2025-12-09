import { Routes } from '@angular/router';
import { GameEntryComponent } from './components/Session Creation/game-entry.component';
import { QuizComponent } from './components/quiz.component';

export const routes: Routes = [
  { path: '', component: GameEntryComponent },
  { path: 'game', component: QuizComponent },
  { path: '**', redirectTo: '' }
];
