// landing-page.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';
import { User } from 'firebase/auth';

interface Translations {
  title: string;
  subtitle: string;
  cta: string;
  login: string;
  players: string;
  difficulty: string;
  timer: string;
  easy: string;
  medium: string;
  hard: string;
  diffNote: string;
  customize: string;
  enterMinutes: string;
  sessionName: string;
  sessionNamePlaceholder: string;
  createSession: string;
  joinSession: string;
  enterCode: string;
  codePlaceholder: string;
  validateAndJoin: string;
  loginDesc: string;
  email: string;
  password: string;
  or: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.scss']
})
export class LandingPageComponent {
  // Language and RTL
  language = signal<'en' | 'fr' | 'ar'>('en');
  currentUser = signal<User | null>(null);


  // Modals
  showSessionModal = signal(false);
  showLoginModal = signal(false);
  showAuthChoiceModal = signal(false);
  showAccountMenu = signal(false);
  sessionMode = signal<'create' | 'join'>('create');
  customTimer = signal(false);

  // Game/session settings
  players: 2 | 3 | 4 = 2;
  difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  minutes = 15;
  playerName = '';
  joinGameId = '';
  errorMsg = '';

  // Login inputs
  email = '';
  password = '';
  loginError = '';

  // Translations
  translations: Record<'en' | 'fr' | 'ar', Translations> = {
    en: {
      title: 'Unlimited Geography Quizzes, and Much More',
      subtitle: 'Play anywhere • Challenge your friends anytime',
      cta: 'Start Playing',
      login: 'Sign In',
      players: 'Players',
      difficulty: 'Difficulty',
      timer: 'Timer',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      diffNote: 'Easy: pick freely • Medium: alternates pick/random • Hard: dice only',
      customize: 'Custom',
      enterMinutes: 'Enter minutes...',
      sessionName: 'Session Name',
      sessionNamePlaceholder: 'Enter your name...',
      createSession: 'Create Session',
      joinSession: 'Join Session',
      enterCode: 'Enter Session Code',
      codePlaceholder: 'Enter code...',
      validateAndJoin: 'Validate & Join',
      loginDesc: 'Sign in to save your progress',
      email: 'Email',
      password: 'Password',
      or: 'or'
    },
    fr: {
      title: 'Quiz de Géographie Illimités, et Bien Plus',
      subtitle: 'Jouez partout • Défiez vos amis à tout moment',
      cta: 'Commencer à Jouer',
      login: "S'identifier",
      players: 'Joueurs',
      difficulty: 'Difficulté',
      timer: 'Minuteur',
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
      diffNote: 'Facile: choix libre • Moyen: alterne choix/aléatoire • Difficile: dés uniquement',
      customize: 'Personnaliser',
      enterMinutes: 'Entrez les minutes...',
      sessionName: 'Nom de Session',
      sessionNamePlaceholder: 'Entrez votre nom...',
      createSession: 'Créer Session',
      joinSession: 'Rejoindre Session',
      enterCode: 'Entrer le Code',
      codePlaceholder: 'Entrez le code...',
      validateAndJoin: 'Valider et Rejoindre',
      loginDesc: 'Connectez-vous pour sauvegarder votre progression',
      email: 'Email',
      password: 'Mot de passe',
      or: 'ou'
    },
    ar: {
      title: 'اختبارات جغرافيا غير محدودة، وأكثر من ذلك',
      subtitle: 'العب في أي مكان • تحدى أصدقائك في أي وقت',
      cta: 'ابدأ اللعب',
      login: 'تسجيل الدخول',
      players: 'اللاعبون',
      difficulty: 'الصعوبة',
      timer: 'المؤقت',
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
      diffNote: 'سهل: اختر بحرية • متوسط: يتناوب بين الاختيار/العشوائي • صعب: النرد فقط',
      customize: 'تخصيص',
      enterMinutes: 'أدخل الدقائق...',
      sessionName: 'اسم الجلسة',
      sessionNamePlaceholder: 'أدخل اسمك...',
      createSession: 'إنشاء جلسة',
      joinSession: 'الانضمام إلى الجلسة',
      enterCode: 'أدخل رمز الجلسة',
      codePlaceholder: 'أدخل الرمز...',
      validateAndJoin: 'التحقق والانضمام',
      loginDesc: 'سجل الدخول لحفظ تقدمك',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      or: 'أو'
    }
  };

  constructor(
    private router: Router,
    private auth: AuthService,
    private games: GameService
  ) {    this.auth.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });}

  // Account helpers
  toggleAccountMenu(): void {
    this.showAccountMenu.set(!this.showAccountMenu());
  }

  get isGuest() {
    try { return sessionStorage.getItem('guest') === '1'; } catch { return false; }
  }

  async logoutAccount(): Promise<void> {
    this.showAccountMenu.set(false);
    try {
      if (this.isGuest) {
        // Delete anonymous guest account
        await this.auth.deleteAnonymousIfGuest();
      } else {
        await this.auth.logout();
      }
    } catch (e) {
      console.error('Logout error', e);
    }
  }

  // Track an intended action when user must choose auth vs guest
  pendingAction: 'create' | 'join' | null = null;

  // Convenience getters
  get t() {
    return this.translations[this.language()];
  }

  get isRTL() {
    return this.language() === 'ar';
  }

  // Timer
  setTimer(min: number) {
    this.minutes = min;
    this.customTimer.set(false);
  }

  toggleCustomTimer() {
    this.customTimer.set(!this.customTimer());
    if (this.customTimer()) this.minutes = 15;
  }

  // Close modals
  closeSessionModal() {
    this.showSessionModal.set(false);
    this.errorMsg = '';
    this.sessionMode.set('create');
  }

  closeLoginModal() {
    this.showLoginModal.set(false);
    this.email = '';
    this.password = '';
    this.loginError = '';
  }

  // Persist local game settings
  private persistSettings(): void {
    const settings = {
      players: this.players,
      difficulty: this.difficulty,
      minutes: Math.max(1, Math.floor(this.minutes))
    };
    try {
      localStorage.setItem('gameSettings', JSON.stringify(settings));
    } catch {}
  }

  // Session creation
  async createSession(): Promise<void> {
    this.errorMsg = '';
    this.persistSettings();

    if (!this.playerName.trim()) {
      this.errorMsg = 'Please enter a session name';
      return;
    }

    try {
      const settings = {
        players: this.players,
        difficulty: this.difficulty,
        minutes: Math.max(1, Math.floor(this.minutes))
      };
      const gameId = await this.games.createGame(this.playerName.trim(), settings);
      try {
        localStorage.setItem('gameId', gameId);
      } catch {}
      this.router.navigate(['/game']);
    } catch (e: any) {
      this.errorMsg = 'Could not create session';
      console.error(e);
    }
  }

  // Called when user clicks create, ensures auth choice if necessary
  attemptCreate(): void {
    if (this.isLoggedIn) {
      void this.createSession();
      return;
    }
    this.pendingAction = 'create';
    this.showAuthChoiceModal.set(true);
  }

  // Join existing session
  async joinSession(): Promise<void> {
    this.errorMsg = '';
    this.persistSettings();
    const gid = this.joinGameId.trim();

    if (!gid) {
      this.errorMsg = 'Enter a valid join code';
      return;
    }

    if (!this.playerName.trim()) {
      this.errorMsg = 'Please enter your name';
      return;
    }

    try {
      await this.games.joinGame(gid, this.playerName.trim());
      try {
        localStorage.setItem('gameId', gid);
      } catch {}
      this.router.navigate(['/game']);
    } catch (e: any) {
      this.errorMsg = 'Could not join session';
      console.error(e);
    }
  }

  // Called when user clicks join, ensures auth choice if necessary
  attemptJoin(): void {
    if (this.isLoggedIn) {
      void this.joinSession();
      return;
    }
    this.pendingAction = 'join';
    this.showAuthChoiceModal.set(true);
  }

  // Play as guest (explicit): sign in anonymously and mark session-only guest
  async playAsGuestAndProceed(): Promise<void> {
    try {
      await this.auth.loginAnonymously();
      // Mark as guest for session lifetime only
      try { sessionStorage.setItem('guest', '1'); } catch {}
      this.showAuthChoiceModal.set(false);
      if (this.pendingAction === 'create') {
        await this.createSession();
      } else if (this.pendingAction === 'join') {
        await this.joinSession();
      }
    } catch (e) {
      console.error('Guest login failed', e);
      this.showAuthChoiceModal.set(false);
      this.loginError = 'Could not start guest session';
    } finally {
      this.pendingAction = null;
    }
  }

  // Open regular sign-in modal from auth choice
  openSignInFromChoice(): void {
    this.showAuthChoiceModal.set(false);
    this.showLoginModal.set(true);
  }

  // Login modal
  async onLogin(): Promise<void> {
    this.loginError = '';

    if (!this.email.trim() || !this.password.trim()) {
      this.loginError = 'Please enter both email and password';
      return;
    }

    try {
      await this.auth.login(this.email.trim(), this.password.trim());
      this.closeLoginModal();
      this.router.navigate(['/']); 
    } catch (err: any) {
      this.loginError = err.message || 'Login failed';
    }
  }
  get userInitials() {
    if (!this.currentUser()?.email) return '';
    const email = this.currentUser()!.email!;
    const parts = email.split('@')[0].split(/[.\-_]/); // split by dot, dash, underscore
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  get isLoggedIn() {
    return !!this.currentUser();
  }
}
