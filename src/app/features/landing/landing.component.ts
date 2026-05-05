import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStorageService } from '../../core/services/auth-storage.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  isLoggedIn = false;

  constructor(
    private authStorage: AuthStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!this.authStorage.getAccessToken();
  }

  viewJobDetails(jobId: number): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/jobs', jobId]);
    } else {
      this.router.navigate(['/login']);
    }
  }

  goToJobs(): void {
    this.router.navigate(['/explore']);
  }

  goToStart(): void {
    if (this.isLoggedIn) {
      const role = this.authStorage.getUserRole();
      if (role === 'RECRUITER') {
        this.router.navigate(['/recruiter/dashboard']);
        return;
      }
      if (role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
        return;
      }
      this.router.navigate(['/candidate/dashboard']);
      return;
    }
    this.router.navigate(['/register']);
  }
}
