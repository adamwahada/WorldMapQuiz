import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal<'en' | 'fr' | 'ar'>('en');

  setLanguage(language: 'en' | 'fr' | 'ar') {
    this.lang.set(language);
  }

  getLanguage() {
    return this.lang();
  }
}
