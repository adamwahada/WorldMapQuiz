import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { GameService } from './game.service';
import { AuthService } from './auth.service';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private games: GameService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const gameId = route.paramMap.get('id');
    if (!gameId) {
      this.router.navigate(['/404']);
      return of(false);
    }

    return this.auth.currentUser$.pipe(
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/']);
          return of(false);
        }
        return this.games.listenToGameOnce(gameId).then(game => {
          // If no game or user not in players, block access
          if (!game || !game.players[user.uid]) {
            this.router.navigate(['/404']);
            return false;
          }
          return true;
        });
      })
    );
  }
}
