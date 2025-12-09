import { Component } from '@angular/core';
import { LandingPageComponent } from './components/Session Creation/landing-page';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
})
export class RootComponent {}
