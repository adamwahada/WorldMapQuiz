import { Component, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameService, GameSession, Player, GameSettings } from '../../services/game.service';
import { User } from 'firebase/auth';
import { LanguageService } from '../../services/language.service';
import { translations, Translations } from './translations';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.scss']
})
export class LandingPageComponent {

  // ---------------------
  // Signals / state
  // ---------------------
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

  // Track intended action for guest login
  pendingAction: 'create' | 'join' | null = null;

  constructor(
    public router: Router,
    private auth: AuthService,
    private games: GameService,
    private languageService: LanguageService,
    private toastr: ToastrService
  ) {
    this.language.set(this.languageService.getLanguage());

    // Subscribe to auth changes
    this.auth.currentUser$.subscribe(user => this.currentUser.set(user));
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
    try { return sessionStorage.getItem('guest') === '1'; } catch { return false; }
  }

  async logoutAccount(): Promise<void> {
    this.showAccountMenu.set(false);
    try {
      if (this.isGuest) {
        await this.auth.deleteAnonymousIfGuest();
      } else {
        await this.auth.logout();
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Logout error', e);
    }
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  get userInitials(): string {
    const email = this.currentUser()?.email || '';
    const parts = email.split('@')[0].split(/[.\-_]/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  navigateToSignup() {
    this.showLoginModal.set(false);
    this.showAuthChoiceModal.set(false);
    this.router.navigate(['/signup']);
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
    const settings: GameSettings = {
      players: this.players,
      difficulty: this.difficulty,
      minutes: Math.max(1, Math.floor(this.minutes))
    };
    try {
      localStorage.setItem('gameSettings', JSON.stringify(settings));
    } catch {}
  }

  // ---------------------
  // Create session
  // ---------------------
async createSession(): Promise<void> {
  this.loading.set(true);
  this.persistSettings();

  if (!this.playerName.trim()) {
    this.toastr.error('Please enter a session name', 'Error');
    this.loading.set(false);
    return;
  }

  try {
    const settings: GameSettings = {
      players: this.players,
      difficulty: this.difficulty,
      minutes: Math.max(1, Math.floor(this.minutes))
    };
    const maxPlayers = this.players;

    // Check if user already joined a session
    const joinedGameId = localStorage.getItem('gameId');
    if (joinedGameId) {
      this.toastr.error('You have already joined a session!', 'Error');
      this.loading.set(false);
      return;
    }

    // Debug: log current user and params
    console.log('Attempting to create game:', {
      playerName: this.playerName.trim(),
      settings,
      maxPlayers,
      currentUser: this.auth.currentUser$ ? this.auth.currentUser$ : null
    });

    const { gameId, code } = await this.games.createGame(this.playerName.trim(), settings, maxPlayers);

    localStorage.setItem('gameId', gameId);
    localStorage.setItem('gameCode', code);

    this.router.navigate(['/waiting-room', gameId]);
  } catch (e: any) {
    // Debug: log error to console
    console.error('Create session error:', e);
    this.toastr.error(e.message || 'Could not create session');
  } finally {
    this.loading.set(false);
  }
}


  attemptCreate(): void {
    // Always log when the button is clicked
    console.log('Create Session button clicked');
    if (this.isLoggedIn) {
      void this.createSession();
      return;
    }
    this.pendingAction = 'create';
    this.showAuthChoiceModal.set(true);
  }

  // ---------------------
  // Join session
  // ---------------------
async joinSession(): Promise<void> {
  this.persistSettings();

  if (!this.joinGameCode.trim()) {
    this.toastr.error('Enter a valid join code');
    return;
  }

  if (!this.playerName.trim()) {
    this.toastr.error('Please enter session name');
    return;
  }

  const joinedGameId = localStorage.getItem('gameId');
  if (joinedGameId) {
    this.toastr.error('You have already joined a session!');
    return;
  }

  this.loading.set(true);
  try {
    const { gameId } = await this.games.joinGameByCode(this.joinGameCode.trim(), this.playerName.trim());
    localStorage.setItem('gameId', gameId);
    localStorage.setItem('gameCode', this.joinGameCode.trim());

    this.router.navigate(['/waiting-room', gameId]);
  } catch (e: any) {
    this.toastr.error(e.message || 'Could not join session', 'Error');
  } finally {
    this.loading.set(false);
  }
}

  attemptJoin(): void {
    if (this.isLoggedIn) {
      void this.joinSession();
      return;
    }
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
    } catch (e) {
      console.error('Guest login failed', e);
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
    const message = err.message || 'Login failed';
    this.toastr.error(message, 'Login Error');
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
}
