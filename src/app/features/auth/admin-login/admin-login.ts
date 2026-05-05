import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStorageService } from '../../../core/services/auth-storage.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLoginComponent {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private authStorage: AuthStorageService,
    private router: Router
  ) {}

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
        if (response.role !== 'ADMIN') {
          this.errorMessage = 'Access denied. Admin credentials required.';
          this.isLoading = false;
          return;
        }

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
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Admin login failed';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegularLogin(): void {
    this.router.navigate(['/login']);
  }
}
