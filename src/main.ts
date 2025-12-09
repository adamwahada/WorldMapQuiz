import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RootComponent } from './app/root.component';
import { appConfig } from './app/app.config';

// --- Firebase imports ---
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from './environments/firebase';
// Router is provided via appConfig

// --- Initialize Firestore and Auth (browser-only) ---
export let db: any;
export let auth: any;

if (typeof window !== 'undefined') {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // --- Optional: sign in anonymously ---
  signInAnonymously(auth)
    .then(() => console.log('Signed in anonymously'))
    .catch((err) => console.error('Firebase auth error:', err));

  // --- Bootstrap Angular app (client) ---
  bootstrapApplication(RootComponent, appConfig)
    .catch(err => console.error(err));
}
