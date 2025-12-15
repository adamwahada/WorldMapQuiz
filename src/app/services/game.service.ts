import { Injectable } from '@angular/core';
import { db, auth } from '../../main'; 
import { deleteField, getDoc } from 'firebase/firestore';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

export interface GameSettings {
  players: 1 | 2 | 3 | 4;
  difficulty: 'easy' | 'medium' | 'hard';
  minutes: number;
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
  expiresAt: Timestamp;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor() {}

  /** Create a new game session */
  async createGame(playerName: string, settings: GameSettings, maxPlayers: number) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const code = nanoid(8);
    const gameRef = await addDoc(collection(db, 'games'), {
      ownerId: user.uid,
      code,
      status: 'waiting',
      maxPlayers,
      settings,
      players: {
        [user.uid]: { 
          name: playerName, 
          joinedAt: Timestamp.now(),
          status: 'active'
        },
      },
      startTimestamp: null,
    });

    return { gameId: gameRef.id, code };
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

    const currentPlayers = Object.keys(gameData.players || {});
    if (currentPlayers.length >= gameData.maxPlayers) throw new Error('This room is full.');

    // Add player
    await updateDoc(doc(db, 'games', gameDoc.id), {
      [`players.${user.uid}`]: { 
        name: playerName, 
        joinedAt: Timestamp.now(),
        status: 'active'
      },
    });

    // Return gameId + current game data
    return { gameId: gameDoc.id, ...gameData };
  }

  /** Listen for game updates */
  listenToGame(gameId: string, callback: (data: GameSession) => void) {
    const gameDoc = doc(db, 'games', gameId);
    return onSnapshot(gameDoc, docSnap => {
      if (docSnap.exists()) callback(docSnap.data() as GameSession);
    });
  }
  async listenToGameOnce(gameId: string) {
  const docRef = doc(db, 'games', gameId);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as GameSession) : null;
}

  /** Update game status (playing/finished) */
  async updateGameStatus(gameId: string, status: 'waiting' | 'playing' | 'finished') {
    await updateDoc(doc(db, 'games', gameId), { status });
  }

  /** Set shared start timestamp for countdown */
  async setStartTimestamp(gameId: string, timestamp: number) {
    await updateDoc(doc(db, 'games', gameId), { startTimestamp: Timestamp.fromMillis(timestamp) });
  }

  /** Remove a player from a session */
  async removePlayer(gameId: string, playerId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const gameRef = doc(db, 'games', gameId);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) throw new Error('Game not found.');
    const gameData = snap.data() as GameSession;

    // Only creator can remove others; players can remove themselves
    if (playerId !== user.uid && gameData.ownerId !== user.uid) {
      throw new Error('Only the creator can remove other players.');
    }

    // Mark player as left instead of deleting
    await updateDoc(gameRef, { 
      [`players.${playerId}`]: { 
        ...gameData.players[playerId],
        status: 'left',
        leftAt: Timestamp.now()
      } 
    });
  }

  /** Delete a game (only creator can) */
  async deleteGame(gameId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const gameRef = doc(db, 'games', gameId);
    const snap = await getDocs(query(collection(db, 'games'), where('code', '==', gameId)));
    if (snap.empty) throw new Error('Game not found.');
    const gameData = snap.docs[0].data() as GameSession;

    if (gameData.ownerId !== user.uid) throw new Error('Only the creator can delete this session.');
    await deleteDoc(gameRef);
  }
}
