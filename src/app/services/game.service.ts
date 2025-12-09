import { Injectable } from '@angular/core';
import { db, auth } from '../../main'; // Firestore & Auth
import { doc, collection, addDoc, updateDoc } from 'firebase/firestore';

export interface GameSettings {
  players: 2 | 3 | 4;
  difficulty: 'easy' | 'medium' | 'hard';
  minutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor() {}

  // Create a new game session with settings
  async createGame(playerName: string, settings: GameSettings) {
    const user = auth.currentUser!;
    const gameRef = await addDoc(collection(db, 'games'), {
      host: user.uid,
      status: 'waiting', // waiting | playing | finished
      settings,          // store session-specific values
      players: {
        [user.uid]: { name: playerName }
      }
    });
    return gameRef.id;
  }

  // Join an existing game session
  async joinGame(gameId: string, playerName: string) {
    const user = auth.currentUser!;
    const gameDoc = doc(db, 'games', gameId);
    await updateDoc(gameDoc, {
      [`players.${user.uid}`]: { name: playerName }
    });
  }
}
