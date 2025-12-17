import { Injectable } from '@angular/core';
import { db, auth } from '../../main';
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { getApp } from 'firebase/app';

export interface GameSettings {
  players: 1 | 2 | 3 | 4;
  difficulty: 'easy' | 'medium' | 'hard';
  minutes: number;
}

export interface CreateGameResponse {
  gameId: string;
  code: string; // always a string now
}

export interface Player {
  name: string;
  joinedAt: Timestamp;
  status: 'active' | 'left' | 'idle';
  leftAt?: Timestamp;
}

export interface GameSession {
  ownerId: string;
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  settings: GameSettings;
  players: Record<string, Player>;
  startTimestamp?: Timestamp;
  expiresAt?: Timestamp;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private createGameCallable: any;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const functions = getFunctions(getApp());
        // httpsCallable for Cloud Function (emulator already connected in main.ts)
        this.createGameCallable = httpsCallable(functions, 'createGame', {
          timeout: 30000
        });
      } catch (err) {
        console.error('Failed to initialize Firebase Functions:', err);
      }
    }
  }

  /** Create a new game session directly in Firestore (fallback from Cloud Function) */
  async createGame(
    playerName: string,
    settings: GameSettings,
    maxPlayers: number
  ): Promise<CreateGameResponse> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Try Cloud Function first (if emulator is running)
    try {
      if (this.createGameCallable) {
        const result = await this.createGameCallable({
          playerName,
          settings,
          maxPlayers,
        });
        const data = result.data as CreateGameResponse;
        if (data?.code) return data;
      }
    } catch (err) {
      console.warn('Cloud Function call failed, using Firestore fallback');
    }

    // Fallback: Create game directly in Firestore
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const gameRef = await addDoc(collection(db, 'games'), {
      ownerId: user.uid,
      code: gameCode,
      status: 'waiting',
      maxPlayers,
      settings,
      players: {
        [user.uid]: {
          name: playerName,
          joinedAt: Timestamp.now(),
          status: 'active',
        },
      },
      startTimestamp: null,
    });

    return {
      gameId: gameRef.id,
      code: gameCode,
    };
  }

  /** Join a game by code */
  async joinGameByCode(code: string, playerName: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(collection(db, 'games'), where('code', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('Game not found.');

    const gameDoc = snapshot.docs[0];
    const gameData = gameDoc.data() as GameSession;

    // Validate session is still joinable
    if (gameData.status !== 'waiting') {
      throw new Error('This session is no longer accepting players.');
    }

    const currentPlayers = Object.keys(gameData.players || {});
    
    // Check if already in session
    if (currentPlayers.includes(user.uid)) {
      throw new Error('You are already in this session.');
    }

    // Check if room is full
    if (currentPlayers.length >= gameData.maxPlayers) {
      throw new Error('This room is full.');
    }

    console.log(`Joining game ${gameDoc.id} with code ${code}. Current players: ${currentPlayers.length}, Max: ${gameData.maxPlayers}`);

    await updateDoc(doc(db, 'games', gameDoc.id), {
      [`players.${user.uid}`]: {
        name: playerName,
        joinedAt: Timestamp.now(),
        status: 'active',
      },
    });

    return { gameId: gameDoc.id, ...gameData };
  }

  /** Listen to game updates (real-time) */
  listenToGame(gameId: string, callback: (data: GameSession) => void) {
    const gameDoc = doc(db, 'games', gameId);
    return onSnapshot(gameDoc, (docSnap) => {
      if (docSnap.exists()) callback(docSnap.data() as GameSession);
    });
  }

  /** Fetch game data once */
  async listenToGameOnce(gameId: string): Promise<GameSession | null> {
    const docRef = doc(db, 'games', gameId);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as GameSession) : null;
  }

  /** Update game status */
  async updateGameStatus(gameId: string, status: 'waiting' | 'playing' | 'finished') {
    await updateDoc(doc(db, 'games', gameId), { status });
  }

  /** Set shared start timestamp */
  async setStartTimestamp(gameId: string, timestamp: number) {
    await updateDoc(doc(db, 'games', gameId), { startTimestamp: Timestamp.fromMillis(timestamp) });
  }

  /** Remove a player from a session */
  async removePlayer(gameId: string, playerId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(collection(db, 'games'), where('code', '==', gameId));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Game not found.');
    const gameData = snap.docs[0].data() as GameSession;

    if (playerId !== user.uid && gameData.ownerId !== user.uid) {
      throw new Error('Only the creator can remove other players.');
    }

    await updateDoc(doc(db, 'games', snap.docs[0].id), {
      [`players.${playerId}`]: {
        ...gameData.players[playerId],
        status: 'left',
        leftAt: Timestamp.now(),
      },
    });
  }

  /** Delete a game (only creator can) */
  async deleteGame(gameId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(collection(db, 'games'), where('code', '==', gameId));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Game not found.');
    const gameData = snap.docs[0].data() as GameSession;

    if (gameData.ownerId !== user.uid) throw new Error('Only the creator can delete this session.');
    await deleteDoc(doc(db, 'games', snap.docs[0].id));
  }
}
