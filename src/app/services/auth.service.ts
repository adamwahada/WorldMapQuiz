import { Injectable } from '@angular/core';
import { auth } from '../../main';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  deleteUser,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    if (auth) {
      // Listen for auth state changes
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // If the user is anonymous but not an explicit session guest, sign them out.
          let isGuestFlag = false;
          try { isGuestFlag = sessionStorage.getItem('guest') === '1'; } catch {}
          console.log('User signed in:', user.uid);
          this.currentUserSubject.next(user);
        } else {
          console.log('No user signed in');
          this.currentUserSubject.next(null);
        }
      });
    }
  }

  // Delete the current user (useful for removing anonymous guest accounts)
  async deleteCurrentUser(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) return;
    try {
      await deleteUser(user);
      console.log('Deleted current user:', user.uid);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }

  // Helper: delete current user only if anonymous and marked as guest in sessionStorage
  async deleteAnonymousIfGuest(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) return;
    const isGuest = (() => {
      try { return sessionStorage.getItem('guest') === '1'; } catch { return false; }
    })();
    if (user.isAnonymous && isGuest) {
      try {
        await this.deleteCurrentUser();
        try { sessionStorage.removeItem('guest'); } catch {}
      } catch (e) {
        // If deletion fails, still attempt sign out to remove session
        try { await this.logout(); } catch {}
      }
    }
  }

  // -------------------------------
  // Anonymous login
  // -------------------------------
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

  // -------------------------------
  // Email/password signup
  // -------------------------------
  signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        console.log('User signed up:', cred.user.uid);
        return cred.user;
      })
      .catch((err) => {
        console.error('Signup error:', err);
        throw err;
      });
  }

  // -------------------------------
  // Email/password login
  // -------------------------------
  login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        console.log('User logged in:', cred.user.uid);
        return cred.user;
      })
      .catch((err) => {
        console.error('Login error:', err);
        throw err;
      });
  }

  // -------------------------------
  // Logout
  // -------------------------------
  logout() {
    return signOut(auth)
      .then(() => {
        console.log('User signed out');
      })
      .catch((err) => {
        console.error('Logout error:', err);
        throw err;
      });
  }

  // Get current user synchronously
  getCurrentUser(): User | null {
    return auth ? auth.currentUser : null;
  }
}
