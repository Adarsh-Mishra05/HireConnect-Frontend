import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStorageService } from '../../../../core/services/auth-storage.service';
import { JobResponse, JobService } from '../../../../core/services/job.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';

type CandidateFilter = 'ALL' | 'APPLIED' | 'NOT_APPLIED' | 'SAVED';

@Component({
  selector: 'app-candidate-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './candidate-jobs.html',
  styleUrl: './candidate-jobs.css'
})
export class CandidateJobsComponent implements OnInit {
  jobs: JobResponse[] = [];
  filteredJobs: JobResponse[] = [];

  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  activeFilter: CandidateFilter = 'ALL';
  isGuest = true;

  appliedJobIds = new Set<number>();
  applyingJobIds = new Set<number>();
  savedJobIds = new Set<number>();

  constructor(
    private authStorage: AuthStorageService,
    private router: Router,
    private jobService: JobService,
    private profileService: ProfileService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isGuest = !this.authStorage.getAccessToken();
    this.loadJobsAndApplications();
  }

  loadJobsAndApplications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.jobService.getOpenJobs().subscribe({
      next: (response: JobResponse[]) => {
        this.jobs = [...response].sort((a, b) => {
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        });

        if (this.isGuest) {
          this.applyFilters();
          this.isLoading = false;
          return;
        }

        this.loadMyApplications();
        this.loadSavedJobs();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to load jobs';
        this.isLoading = false;
        this.toastService.show(this.errorMessage, 'error');
      }
    });
  }

  loadMyApplications(): void {
    this.jobService.getMyApplications().subscribe({
      next: (applications: any[]) => {
        this.appliedJobIds = new Set(
          applications.map(app => Number(app.jobId))
        );

        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.applyFilters();
        this.isLoading = false;
      }
    });
  }

  loadSavedJobs(): void {
    this.jobService.getSavedJobs().subscribe({
      next: (savedJobs) => {
        this.savedJobIds = new Set((savedJobs || []).map(job => Number(job.jobId)));
        this.applyFilters();
      },
      error: () => {
        this.savedJobIds = new Set<number>();
      }
    });
  }

  applyFilters(): void {
    const value = this.searchTerm.toLowerCase().trim();

    let result = [...this.jobs];

    if (value) {
      result = result.filter(job =>
        job.title?.toLowerCase().includes(value) ||
        job.companyName?.toLowerCase().includes(value) ||
        job.location?.toLowerCase().includes(value) ||
        job.jobType?.toLowerCase().includes(value) ||
        job.skillsRequired?.toLowerCase().includes(value)
      );
    }

    if (this.activeFilter === 'APPLIED') {
      result = result.filter(job => this.isApplied(Number(job.jobId)));
    } else if (this.activeFilter === 'SAVED') {
      result = result.filter(job => this.isSaved(Number(job.jobId)));
    } else if (this.activeFilter === 'NOT_APPLIED') {
      result = result.filter(job => !this.isApplied(Number(job.jobId)));
    }

    this.filteredJobs = result;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  setFilter(filter: CandidateFilter): void {
    if (this.isGuest && (filter === 'APPLIED' || filter === 'SAVED')) {
      this.toastService.show('Please login to view applied or saved jobs', 'error');
      this.router.navigate(['/login']);
      return;
    }
    this.activeFilter = filter;
    this.applyFilters();
  }

  isApplied(jobId: number): boolean {
    return this.appliedJobIds.has(Number(jobId));
  }

  isApplying(jobId: number): boolean {
    return this.applyingJobIds.has(Number(jobId));
  }

  isSaved(jobId: number): boolean {
    return this.savedJobIds.has(Number(jobId));
  }

  applyToJob(jobId: number): void {
    if (!this.authStorage.getAccessToken()) {
      this.toastService.show('Please login to apply for a job', 'error');
      this.router.navigate(['/login']);
      return;
    }

    if (this.isApplied(jobId) || this.isApplying(jobId)) {
      return;
    }

    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        const firstName = profile?.firstName?.trim?.() || '';
        const phone = profile?.phone?.trim?.() || '';
        if (!firstName || !phone) {
          this.toastService.show('Complete your profile (name and phone number) before applying', 'error');
          return;
        }

        this.submitApplication(jobId);
      },
      error: () => {
        this.toastService.show('Complete your profile before applying', 'error');
      }
    });
  }

  private submitApplication(jobId: number): void {
    this.applyingJobIds.add(jobId);

    this.jobService.applyToJob(jobId).subscribe({
      next: () => {
        this.applyingJobIds.delete(jobId);
        this.appliedJobIds.add(Number(jobId));
        this.applyFilters();
        this.toastService.show('Application submitted successfully', 'success');
      },
      error: (error) => {
        this.applyingJobIds.delete(jobId);
        const message = error?.error?.message || 'Failed to apply for job';
        this.toastService.show(message, 'error');
      }
    });
  }

  formatSalary(job: JobResponse): string {
    return `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
  }

  toggleSave(jobId: number): void {
    if (this.isSaved(jobId)) {
      this.jobService.removeSavedJob(jobId).subscribe({
        next: () => {
          this.savedJobIds.delete(jobId);
          this.applyFilters();
          this.toastService.show('Removed from saved jobs', 'success');
        },
        error: () => {
          this.toastService.show('Failed to remove saved job', 'error');
        }
      });
      return;
    }

    this.jobService.saveJob(jobId).subscribe({
      next: () => {
        this.savedJobIds.add(jobId);
        this.applyFilters();
        this.toastService.show('Job saved', 'success');
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to save job';
        this.toastService.show(message, 'error');
      }
    });
  }
}
