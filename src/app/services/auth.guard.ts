import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

canActivate(): Observable<boolean> {
  return this.auth.currentUser$.pipe(
    map(user => {
      // Allow if user exists (logged in or anonymous guest)
      if (user) return true;

      // Otherwise redirect to login
      this.router.navigate(['/login']);
      return false;
    })
  );
}
}
