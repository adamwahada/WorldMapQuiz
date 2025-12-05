import { Routes } from '@angular/router';
import { StartComponent } from './start.component';
import { App } from './app';

export const routes: Routes = [
  { path: '', component: StartComponent },
  { path: 'game', component: App },
  { path: '**', redirectTo: '' }
];
