import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobService, JobResponse } from '../../core/services/job.service';

@Component({
  selector: 'app-public-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-jobs.component.html',
  styleUrls: ['./public-jobs.component.css']
})
export class PublicJobsComponent implements OnInit {
  jobs: JobResponse[] = [];
  isLoading = true;

  constructor(private jobService: JobService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.jobService.getOpenJobs().subscribe({
      next: (data) => {
        this.jobs = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching jobs', err);
        this.isLoading = false;
      }
    });
  }

  getSalaryRange(job: JobResponse): string {
    if (job.salaryMin && job.salaryMax) {
      return `Rs. ${job.salaryMin.toLocaleString()} - Rs. ${job.salaryMax.toLocaleString()}`;
    } else if (job.salaryMin) {
      return `Rs. ${job.salaryMin.toLocaleString()}+`;
    } else if (job.salaryMax) {
      return `Up to Rs. ${job.salaryMax.toLocaleString()}`;
    }
    return 'Competitive';
  }
}
