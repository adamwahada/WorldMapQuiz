import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2>Sign Up</h2>
    <form [formGroup]="signupForm" (ngSubmit)="onSignup()">
      <input formControlName="email" placeholder="Email" type="email" />
      <input formControlName="password" placeholder="Password" type="password" />
      <button type="submit">Sign Up</button>
    </form>
    <p *ngIf="errorMessage">{{ errorMessage }}</p>
  `
})
export class SignupComponent {
  signupForm: FormGroup;
  errorMessage = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

async onSignup() {
  console.log('Signup button clicked');
  if (this.signupForm.valid) {
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
      this.errorMessage = err.message;
      console.error('Signup error:', err);
    }
  }
}
}
