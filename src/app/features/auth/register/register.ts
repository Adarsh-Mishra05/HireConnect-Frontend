import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  otp = '';
  role = 'CANDIDATE';
  isLoading = false;
  isOtpLoading = false;
  otpSentMessage = '';
  otpError = '';

  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  selectRole(role: string): void {
    this.role = role;
  }

  onRequestOtp(): void {
    this.otpError = '';
    this.successMessage = '';
    this.errorMessage = '';
    this.otpSentMessage = '';

    if (!this.email) {
      this.otpError = 'Enter your email before requesting an OTP.';
      return;
    }

    this.isOtpLoading = true;
    this.authService.requestOtp(this.email).subscribe({
      next: (message) => {
        this.otpSentMessage = message;
        this.isOtpLoading = false;
      },
      error: (error) => {
        this.otpError = error?.error?.message || error?.error || 'Failed to send OTP';
        this.isOtpLoading = false;
      }
    });
  }

  onRegister(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.isLoading = true;

    if (!this.otp) {
      this.errorMessage = 'Please enter the OTP sent to your email.';
      this.isLoading = false;
      return;
    }

    const request = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      role: this.role,
      otp: this.otp
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isLoading = false;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Registration failed';
      }
    });
  }

  continueWithGoogle(): void {
    this.authService.loginWithGoogle(this.role);
  }

  continueWithGitHub(): void {
    this.authService.loginWithGitHub(this.role);
  }
}
