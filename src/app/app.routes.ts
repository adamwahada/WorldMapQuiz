import { Routes } from '@angular/router';
import { QuizComponent } from './components/quiz.component';
import { LandingPageComponent } from './components/Session Creation/landing-page';
import { SignupComponent } from './components/User Registration/signup.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: SignupComponent },
  { path: 'game', component: QuizComponent },
  { path: '**', redirectTo: '' }
];
