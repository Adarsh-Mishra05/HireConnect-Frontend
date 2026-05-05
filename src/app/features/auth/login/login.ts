import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStorageService } from '../../../core/services/auth-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private authStorage: AuthStorageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParamMap.subscribe(params => {
      const oauthError = params.get('oauthError');
      const genericError = params.get('error');
      if (oauthError || genericError) {
        this.errorMessage = oauthError || genericError || 'OAuth login failed';
      }
    });
  }

  onLogin(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.isLoading = true;

    const request = {
      email: this.email,
      password: this.password
    };

    this.authService.login(request).subscribe({
      next: (response) => {
        this.authStorage.saveSession({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          email: response.email,
          role: response.role,
          userId: response.userId,
          fullName: response.fullName
        });

        this.successMessage = response.message;
        this.isLoading = false;

        if (response.role === 'CANDIDATE') {
          this.router.navigate(['/candidate/dashboard']);
        } else if (response.role === 'RECRUITER') {
          this.router.navigate(['/recruiter/dashboard']);
        } else if (response.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Login failed';

      }
    });
  }

  continueWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  continueWithGitHub(): void {
    this.authService.loginWithGitHub();
  }
}
