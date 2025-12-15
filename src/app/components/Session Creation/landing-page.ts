import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from 'firebase/auth';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../services/auth.service';
import { GameService, GameSettings } from '../../services/game.service';
import { LanguageService } from '../../services/language.service';
import { translations, Translations } from './translations';

interface StoredSession {
  gameId: string;
  gameCode: string;
  expiresAt: number;
}

interface UserStatus {
  isInSession: boolean;
  sessionId?: string;
  updatedAt: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.scss'],
})
export class LandingPageComponent implements OnInit {

  // ---------------------
  // Signals / state
  // ---------------------
  showActiveSessionModal = signal(false);
  activeSession = signal<StoredSession | null>(null);

  language = signal<'en' | 'fr' | 'ar'>('en');
  currentUser = signal<User | null>(null);

  showSessionModal = signal(false);
  showLoginModal = signal(false);
  showAuthChoiceModal = signal(false);
  showAccountMenu = signal(false);

  sessionMode = signal<'create' | 'join'>('create');
  customTimer = signal(false);
  loading = signal(false);

  // ---------------------
  // Game/session settings
  // ---------------------
  players: 2 | 3 | 4 = 2;
  difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  minutes = 15;
  playerName = '';
  joinGameCode = '';

  // ---------------------
  // Login inputs
  // ---------------------
  email = '';
  password = '';
  loginError = '';

  pendingAction: 'create' | 'join' | null = null;

  private readonly SESSION_KEY = 'activeSession';
  private readonly USER_STATUS_KEY = 'userStatus';

  constructor(
    public router: Router,
    private auth: AuthService,
    private games: GameService,
    private languageService: LanguageService,
    private toastr: ToastrService
  ) {
    this.language.set(this.languageService.getLanguage());
    
    // Wait for auth to initialize before subscribing
    this.auth.authInitialized$.subscribe(initialized => {
      if (initialized) {
        this.auth.currentUser$.subscribe(user => {
          this.currentUser.set(user);
          this.checkActiveSession();
        });
      }
    });
  }

  ngOnInit(): void {
    // Check for active session on component init
    this.checkActiveSession();
  }

  private checkActiveSession(): void {
    if (typeof localStorage === 'undefined') return;
    
    const userStatus = this.getUserStatus();
    
    // If user is marked as in session, check if session still exists
    if (userStatus?.isInSession) {
      const session = this.getSession();
      if (session) {
        this.activeSession.set(session);
      } else {
        // Session expired but user status still says they're in session, clear it
        this.clearUserStatus();
        this.activeSession.set(null);
      }
    } else {
      // User is not in session according to status
      this.activeSession.set(null);
    }
  }

  // ---------------------
  // Session helpers (NEW)
  // ---------------------
  private getSession(): StoredSession | null {
    if (typeof localStorage === 'undefined') return null;
    
    const raw = localStorage.getItem(this.SESSION_KEY);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as StoredSession;
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(this.SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(this.SESSION_KEY);
      return null;
    }
  }

  private setSession(gameId: string, gameCode: string): void {
    if (typeof localStorage === 'undefined') return;
    
    const session: StoredSession = {
      gameId,
      gameCode,
      expiresAt: Date.now() + this.minutes * 60_000,
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private clearSession(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.SESSION_KEY);
  }

  private setUserStatus(isInSession: boolean, sessionId?: string): void {
    if (typeof localStorage === 'undefined') return;
    
    const status: UserStatus = {
      isInSession,
      sessionId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(this.USER_STATUS_KEY, JSON.stringify(status));
  }

  private getUserStatus(): UserStatus | null {
    if (typeof localStorage === 'undefined') return null;
    
    const raw = localStorage.getItem(this.USER_STATUS_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserStatus;
    } catch {
      localStorage.removeItem(this.USER_STATUS_KEY);
      return null;
    }
  }

  private clearUserStatus(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.USER_STATUS_KEY);
  }

  // ---------------------
  // Active Session Modal
  // ---------------------
  joinActiveSession(): void {
    const session = this.getSession();
    if (!session) {
      this.toastr.info('Your session has expired');
      this.clearUserStatus();
      this.activeSession.set(null);
      return;
    }
    this.showActiveSessionModal.set(false);
    this.setUserStatus(true, session.gameId);
    this.router.navigate(['/waiting-room', session.gameId]);
  }

  quitActiveSessionModal(): void {
    this.clearSession();
    this.clearUserStatus();
    this.activeSession.set(null);
    this.showActiveSessionModal.set(false);
    this.showSessionModal.set(true);
  }

  closeActiveSessionModal(): void {
    this.showActiveSessionModal.set(false);
  }

  // ---------------------
  // Language
  // ---------------------
  selectLanguage(lang: 'en' | 'fr' | 'ar') {
    this.language.set(lang);
    this.languageService.setLanguage(lang);
  }

  get t(): Translations {
    return translations[this.language()];
  }

  get isRTL(): boolean {
    return this.language() === 'ar';
  }

  // ---------------------
  // Account helpers
  // ---------------------
  toggleAccountMenu(): void {
    this.showAccountMenu.set(!this.showAccountMenu());
  }

  get isGuest(): boolean {
    try {
      return sessionStorage.getItem('guest') === '1';
    } catch {
      return false;
    }
  }

  async logoutAccount(): Promise<void> {
    this.showAccountMenu.set(false);
    try {
      if (this.isGuest) {
        await this.auth.deleteAnonymousIfGuest();
      } else {
        await this.auth.logout();
      }
      // Clear both session and user status on logout
      this.clearSession();
      this.clearUserStatus();
      this.activeSession.set(null);
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Logout error', e);
    }
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  // ---------------------
  // Timer
  // ---------------------
  setTimer(min: number) {
    this.minutes = min;
    this.customTimer.set(false);
  }

  toggleCustomTimer() {
    this.customTimer.set(!this.customTimer());
    if (this.customTimer()) this.minutes = 15;
  }

  // ---------------------
  // Persist settings
  // ---------------------
  private persistSettings(): void {
    if (typeof localStorage === 'undefined') return;
    
    const settings: GameSettings = {
      players: this.players,
      difficulty: this.difficulty,
      minutes: Math.max(1, Math.floor(this.minutes)),
    };
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  }

  // ---------------------
  // Create session
  // ---------------------
  async createSession(): Promise<void> {
    console.log('createSession called');
    this.loading.set(true);
    this.persistSettings();

    if (!this.playerName.trim()) {
      console.log('Player name is empty');
      this.toastr.error('Please enter a session name', 'Error');
      this.loading.set(false);
      return;
    }

    const userStatus = this.getUserStatus();
    if (userStatus?.isInSession) {
      console.log('User is already in a session');
      this.closeSessionModal();
      const session = this.getSession();
      if (session) {
        this.activeSession.set(session);
        this.showActiveSessionModal.set(true);
      }
      this.loading.set(false);
      return;
    }

    try {
      const settings: GameSettings = {
        players: this.players,
        difficulty: this.difficulty,
        minutes: Math.max(1, Math.floor(this.minutes)),
      };

      console.log('Creating game with settings:', settings);
      const { gameId, code } = await this.games.createGame(
        this.playerName.trim(),
        settings,
        this.players
      );

      console.log('Game created:', gameId, code);
      this.setSession(gameId, code);
      this.setUserStatus(true, gameId);
      this.router.navigate(['/waiting-room', gameId]);
    } catch (e: any) {
      console.error('Error creating session:', e);
      this.toastr.error(e.message || 'Could not create session');
    } finally {
      this.loading.set(false);
    }
  }

  attemptCreate(): void {
    console.log('attemptCreate called, isLoggedIn:', this.isLoggedIn);
    if (this.isLoggedIn) {
      void this.createSession();
      return;
    }
    console.log('User not logged in, showing auth choice modal');
    this.pendingAction = 'create';
    this.showAuthChoiceModal.set(true);
  }

  // ---------------------
  // Join session
  // ---------------------
  async joinSession(): Promise<void> {
    console.log('joinSession called');
    this.persistSettings();

    if (!this.joinGameCode.trim()) {
      console.log('Join code is empty');
      this.toastr.error('Enter a valid join code');
      return;
    }

    if (!this.playerName.trim()) {
      console.log('Player name is empty');
      this.toastr.error('Please enter session name');
      return;
    }

    const userStatus = this.getUserStatus();
    if (userStatus?.isInSession) {
      console.log('User is already in a session');
      this.closeSessionModal();
      const session = this.getSession();
      if (session) {
        this.activeSession.set(session);
        this.showActiveSessionModal.set(true);
      }
      return;
    }

    this.loading.set(true);
    try {
      console.log('Joining game with code:', this.joinGameCode.trim());
      const { gameId } = await this.games.joinGameByCode(
        this.joinGameCode.trim(),
        this.playerName.trim()
      );

      console.log('Game joined:', gameId);
      this.setSession(gameId, this.joinGameCode.trim());
      this.setUserStatus(true, gameId);
      this.router.navigate(['/waiting-room', gameId]);
    } catch (e: any) {
      console.error('Error joining session:', e);
      this.toastr.error(e.message || 'Could not join session', 'Error');
    } finally {
      this.loading.set(false);
    }
  }

  attemptJoin(): void {
    console.log('attemptJoin called, isLoggedIn:', this.isLoggedIn);
    if (this.isLoggedIn) {
      void this.joinSession();
      return;
    }
    console.log('User not logged in, showing auth choice modal');
    this.pendingAction = 'join';
    this.showAuthChoiceModal.set(true);
  }

  // ---------------------
  // Guest login
  // ---------------------
  async playAsGuestAndProceed(): Promise<void> {
    try {
      await this.auth.loginAnonymously();
      sessionStorage.setItem('guest', '1');
      this.showAuthChoiceModal.set(false);

      if (this.pendingAction === 'create') {
        await this.createSession();
      } else if (this.pendingAction === 'join') {
        await this.joinSession();
      }
    } catch {
      this.loginError = 'Could not start guest session';
      this.showAuthChoiceModal.set(false);
    } finally {
      this.pendingAction = null;
    }
  }

  // ---------------------
  // Login
  // ---------------------
  openSignInFromChoice(): void {
    this.showAuthChoiceModal.set(false);
    this.showLoginModal.set(true);
  }

  async onLogin(): Promise<void> {
    if (!this.email.trim() || !this.password.trim()) {
      this.toastr.error('Please enter both email and password', 'Login Error');
      return;
    }

    try {
      await this.auth.login(this.email.trim(), this.password.trim());
      this.closeLoginModal();
      this.router.navigate(['/']);
    } catch (err: any) {
      this.toastr.error(err.message || 'Login failed', 'Login Error');
    }
  }

  // ---------------------
  // Close modals
  // ---------------------
  closeSessionModal() {
    this.showSessionModal.set(false);
    this.sessionMode.set('create');
  }

  closeLoginModal() {
    this.showLoginModal.set(false);
    this.email = '';
    this.password = '';
    this.loginError = '';
  }

  navigateToSignup(): void {
  this.showLoginModal.set(false);
  this.showAuthChoiceModal.set(false);
  this.router.navigate(['/signup']);
}
get userInitials(): string {
  const email = this.currentUser()?.email || '';
  if (!email) return '?';

  const parts = email.split('@')[0].split(/[.\-_]/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

}
