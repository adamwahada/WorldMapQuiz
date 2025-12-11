import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { RootComponent } from './app/root.component';
import { appConfig } from './app/app.config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ToastrModule } from 'ngx-toastr';

// Firebase stuff
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './environments/firebase';

export let db: any;
export let auth: any;

if (typeof window !== 'undefined') {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

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
