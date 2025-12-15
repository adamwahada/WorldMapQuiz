import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService, GameSession, Player } from '../../services/game.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { timer, Subscription } from 'rxjs';
import { Timestamp } from 'firebase/firestore'; 
import { DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-waiting-room',
  templateUrl: './waiting-room.html',
  styleUrls: ['./waiting-room.scss'],
  standalone: true,
  imports: [DecimalPipe, CommonModule, FormsModule],
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
  gameId!: string;
  currentUser = signal<User | null>(null);
  gameData = signal<GameSession | null>(null);
  newJoinNotification = signal<string | null>(null);
  countdown = signal<number>(600); // default countdown in seconds
  countdownInterval!: Subscription;
  maxPlayersReached = signal(false);
  Object = Object;

  private unsubscribeGame!: () => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private games: GameService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('id')!;
    // Wait for auth to initialize before accessing currentUser
    this.auth.authInitialized$.subscribe(initialized => {
      if (initialized) {
        this.auth.currentUser$.subscribe(user => this.currentUser.set(user));
      }
    });

    // Listen for real-time game changes
    this.unsubscribeGame = this.games.listenToGame(this.gameId, game => {
      if (!game) return;

      const prevPlayers = this.gameData()?.players || {};
      this.gameData.set(game);

      // Notify new players
      const prevCount = Object.keys(prevPlayers).length;
      const currentCount = Object.keys(game.players || {}).length;
      if (currentCount > prevCount) {
        const newPlayerUid = Object.keys(game.players).find(uid => !prevPlayers[uid]);
        if (newPlayerUid) {
          this.newJoinNotification.set(`${game.players[newPlayerUid].name} joined the session`);
          setTimeout(() => this.newJoinNotification.set(null), 4000);
        }
      }

      // Max players reached
      this.maxPlayersReached.set(currentCount >= game.maxPlayers);

      // Redirect if game started
      if (game.status === 'playing') {
        this.router.navigate(['/game', this.gameId]);
      }

      // Initialize countdown based on shared startTime
      if (!game.startTimestamp) {
        // Auto-start timestamp if owner and enough players
        if (game.ownerId === this.currentUser()?.uid && currentCount >= 2) {
          this.games.setStartTimestamp(this.gameId, Date.now());
        }
      } else {
        const startTime = this.normalizeTimestamp(game.startTimestamp);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        this.countdown.set(Math.max(0, 600 - elapsed));
      }
    });

    // Start local countdown updater
    this.startCountdown();
  }

  /** Normalize startTimestamp to number in milliseconds */
  private normalizeTimestamp(ts: number | Date | Timestamp): number {
    if (ts instanceof Timestamp) return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    return ts; // assume number
  }

  startCountdown(): void {
    this.countdownInterval = timer(0, 1000).subscribe(() => {
      const game = this.gameData();
      if (!game || game.status !== 'waiting' || !game.startTimestamp) return;

      const startTime = this.normalizeTimestamp(game.startTimestamp);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 600 - elapsed);
      this.countdown.set(remaining);

      // Auto-start if countdown reaches 0
      if (remaining === 0 && this.currentUser()?.uid === game.ownerId && Object.keys(game.players).length >= 2) {
        this.startGame();
      }
    });
  }

  startGame(): void {
    const user = this.currentUser();
    const game = this.gameData();
    if (!user || !game) return;
    if (user.uid !== game.ownerId) return;

    this.games.updateGameStatus(this.gameId, 'playing');
  }

  leaveRoom(): void {
    const user = this.currentUser();
    const game = this.gameData();
    if (!user || !game) return;

    if (user.uid === game.ownerId) {
      // Creator cancels the session
      this.games.deleteGame(this.gameId);
    } else {
      // Remove player
      this.games.removePlayer(this.gameId, user.uid);
    }
    this.router.navigate(['/']);
  }

  get remainingSlots(): number {
    const game = this.gameData();
    if (!game) return 0;
    return game.maxPlayers - Object.keys(game.players || {}).length;
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) this.countdownInterval.unsubscribe();
    if (this.unsubscribeGame) this.unsubscribeGame();
  }
}
