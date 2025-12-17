import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { RootComponent } from './app/root.component';
import { appConfig } from './app/app.config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ToastrModule } from 'ngx-toastr';

// Firebase stuff
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { firebaseConfig } from './environments/firebase';

export let db: any;
export let auth: any;

if (typeof window !== 'undefined') {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // Connect to emulators in development
  if (location.hostname === 'localhost') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      const functions = getFunctions(app);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('Connected to Firebase emulators');
    } catch (err) {
      // Emulator might already be connected or not running
      console.log('Emulator connection info:', err);
    }
  }

  bootstrapApplication(RootComponent, {
    ...appConfig,
    providers: [
      provideZoneChangeDetection(),
      ...(appConfig.providers || []),
      provideAnimationsAsync(),
      importProvidersFrom(
        ToastrModule.forRoot({ 
          timeOut: 3000,
          positionClass: 'toast-top-right',
          preventDuplicates: true,
          progressBar: true
        })
      )
    ]
  }).catch(err => console.error(err));
}
