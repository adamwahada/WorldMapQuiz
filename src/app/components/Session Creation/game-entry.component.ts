// landing.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-entry.component.html',
  styleUrls: ['./game-entry.component.scss']
})
export class GameEntryComponent {
  language = signal<'en' | 'fr' | 'ar'>('en');
  showSessionModal = signal(false);
  showLoginModal = signal(false);
  
  players: 2 | 3 | 4 = 2;
  difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  minutes = 15;
  playerName = '';
  joinGameId = '';
  errorMsg = '';

  translations = {
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
      custom: 'Custom (min)',
      yourName: 'Your name',
      createSession: 'Create Session',
      joinCode: 'Join code',
      joinSession: 'Join Session',
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
      custom: 'Personnalisé (min)',
      yourName: 'Votre nom',
      createSession: 'Créer Session',
      joinCode: 'Code rejoindre',
      joinSession: 'Rejoindre Session',
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
      custom: 'مخصص (دقيقة)',
      yourName: 'اسمك',
      createSession: 'إنشاء جلسة',
      joinCode: 'رمز الانضمام',
      joinSession: 'الانضمام إلى الجلسة',
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
  ) {}

  get t() {
    return this.translations[this.language()];
  }

  get isRTL() {
    return this.language() === 'ar';
  }

  closeSessionModal() {
    this.showSessionModal.set(false);
    this.errorMsg = '';
  }

  closeLoginModal() {
    this.showLoginModal.set(false);
  }

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

  async createSession(): Promise<void> {
    this.errorMsg = '';
    this.persistSettings();

    if (!this.playerName.trim()) {
      this.errorMsg = 'Please enter your name';
      return;
    }

    try {
      await this.auth.loginAnonymously();

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
      await this.auth.loginAnonymously();
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
}