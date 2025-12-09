import { Injectable } from '@angular/core';
import { auth } from '../../main';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Guard for SSR: only attach listener when auth is available (browser)
    if (auth) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('User signed in:', user.uid);
          this.currentUserSubject.next(user);
        } else {
          console.log('No user signed in');
          this.currentUserSubject.next(null);
        }
      });
    }
  }

  // Optional: trigger anonymous login (if not already signed in)
  loginAnonymously() {
    return signInAnonymously(auth)
      .then((cred) => {
        console.log('Anonymous user signed in:', cred.user.uid);
        return cred.user;
      })
      .catch((err) => {
        console.error('Error signing in anonymously:', err);
        throw err;
      });
  }

  // Get current user synchronously
  getCurrentUser(): User | null {
    return auth ? auth.currentUser : null;
  }
}
