import { Component, signal } from '@angular/core';

import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { LanguageService } from '../../services/language.service';
import { signupTranslations, SignupTranslations } from './signup.translation';

// Custom password validator
function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const minLength = value.length >= 8;

  if (!value) return { required: true };
  if (!minLength) return { minlength: { requiredLength: 8, actualLength: value.length } };
  if (!hasNumber) return { numberRequired: true };
  if (!hasSpecial) return { specialCharRequired: true };

  return null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class SignupComponent {
  signupForm: FormGroup;
  errorMessage = signal('');
  loading = signal(false);
  passwordVisible = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private languageService: LanguageService
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [passwordValidator]]
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible.set(!this.passwordVisible());
  }

  // Reactive translations getter
  get t(): SignupTranslations {
    return signupTranslations[this.languageService.lang()];
  }

  // Check if current language is RTL
  get isRTL(): boolean {
    return this.languageService.lang() === 'ar';
  }

  // Get validation error messages
  getError(controlName: string): string {
    const control = this.signupForm.get(controlName);
    if (!control || !control.touched || control.valid) return '';
    const errors = control.errors;
    if (!errors) return '';

    const t = this.t;

    if (errors['required']) return t.required;
    if (errors['email']) return t.email;
    if (errors['minlength']) return t.minlength;
    if (errors['numberRequired']) return t.numberRequired;
    if (errors['specialCharRequired']) return t.specialCharRequired;

    return 'Invalid input';
  }

  async onSignup() {
    this.errorMessage.set('');

    if (this.signupForm.invalid) {
      const emailError = this.getError('email');
      const passwordError = this.getError('password');
      this.errorMessage.set(emailError || passwordError || this.t.required);
      return;
    }

    this.loading.set(true);
    const { email, password } = this.signupForm.value;

    try {
      const currentUser = this.auth.getCurrentUser();
      if (currentUser && currentUser.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(currentUser, credential);
      } else {
        await this.auth.signup(email, password);
      }
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Use translated error messages
      if (err.code === 'auth/email-already-in-use') {
        this.errorMessage.set(this.t.emailInUse);
      } else if (err.code === 'auth/invalid-email') {
        this.errorMessage.set(this.t.invalidEmail);
      } else if (err.code === 'auth/weak-password') {
        this.errorMessage.set(this.t.weakPassword);
      } else {
        this.errorMessage.set(err.message || this.t.signupError);
      }
    } finally {
      this.loading.set(false);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/']);
  }
}