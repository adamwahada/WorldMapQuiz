import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RootComponent } from './app/root.component';
import { appConfig } from './app/app.config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// --- Firebase imports ---
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from './environments/firebase';

// --- Initialize Firestore and Auth (browser-only) ---
export let db: any;
export let auth: any;

if (typeof window !== 'undefined') {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // --- Bootstrap Angular app (client) with animations ---
  bootstrapApplication(RootComponent, {
    ...appConfig,
    providers: [
      ...(appConfig.providers || []),
      provideAnimationsAsync()   // ← Add this
    ]
  }).catch(err => console.error(err));
}
