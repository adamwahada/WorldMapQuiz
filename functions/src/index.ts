import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();

export const createGame = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login required');

  const { playerName, settings, maxPlayers } = request.data;
  if (!playerName || !settings || !maxPlayers) {
    throw new HttpsError('invalid-argument', 'Missing data');
  }

  // Limit: 3 games per 24 hours
  const last24h = admin.firestore.Timestamp.fromMillis(
    Date.now() - 24 * 60 * 60 * 1000
  );

  const snap = await db
    .collection('game_creations')
    .where('userId', '==', uid)
    .where('createdAt', '>=', last24h)
    .get();

  if (snap.size >= 3) {
    throw new HttpsError(
      'resource-exhausted',
      'You can only create 3 sessions per 24 hours'
    );
  }

  // Create game
  const gameRef = await db.collection('games').add({
    ownerId: uid,
    status: 'waiting',
    maxPlayers,
    settings,
    players: {
      [uid]: {
        name: playerName,
        joinedAt: admin.firestore.Timestamp.now(),
        status: 'active',
      },
    },
    startTimestamp: null,
  });

  // Log creation
  await db.collection('game_creations').add({
    userId: uid,
    createdAt: admin.firestore.Timestamp.now(),
  });

  return { gameId: gameRef.id };
});
