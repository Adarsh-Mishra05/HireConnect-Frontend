import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ApplicationService,
  RecruiterJobApplicationResponse
} from '../../../core/services/application.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalService } from '../../../core/services/confirm-modal.service';
import { ProfileService } from '../../../core/services/profile.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-job-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './job-applications.html',
  styleUrl: './job-applications.css'
})
export class RecruiterJobApplicationsComponent implements OnInit {
  jobId!: number;
  applications: RecruiterJobApplicationResponse[] = [];
  isLoading = false;

  // [Adarsh Mishra] : Track which candidateId is currently being downloaded
  downloadingResumeFor: number | null = null;
  updatingStatusFor = new Set<number>();
  sendingMessageFor = new Set<number>();
  showMessageModal = false;
  selectedApplication: RecruiterJobApplicationResponse | null = null;
  recruiterMessage = '';

  constructor(
    private route: ActivatedRoute,
    private appService: ApplicationService,
    private toastService: ToastService,
    private confirmModal: ConfirmModalService,
    private profileService: ProfileService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.jobId = Number(this.route.snapshot.paramMap.get('jobId'));
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;

    this.appService.getApplicationsByJob(this.jobId).subscribe({
      next: (res) => {
        this.applications = res;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.show('Failed to load applications', 'error');
        this.isLoading = false;
      }
    });
  }

  async updateStatus(app: RecruiterJobApplicationResponse, status: string): Promise<void> {
    if (this.updatingStatusFor.has(app.applicationId)) {
      return;
    }

    const confirmed = await this.confirmModal.open({
      title: 'Update Application Status',
      message: `Are you sure you want to mark this application as ${status}?`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: status === 'REJECTED' ? 'danger' : 'primary'
    });

    if (!confirmed) return;

    this.updatingStatusFor.add(app.applicationId);
    this.appService.updateStatus(app.applicationId, status).subscribe({
      next: (updated) => {
        app.status = updated?.status || status;
        this.toastService.show('Application status updated', 'success');
        this.updatingStatusFor.delete(app.applicationId);
        this.loadApplications();
      },
      error: () => {
        this.updatingStatusFor.delete(app.applicationId);
        this.toastService.show('Failed to update application status', 'error');
      }
    });
  }

  // [Adarsh Mishra] : Resume Download Operations ────────────────────────────────

  downloadResume(candidateId: number): void {
    if (this.downloadingResumeFor === candidateId) return; // [Adarsh Mishra] : prevent double-click

    this.downloadingResumeFor = candidateId;

    this.profileService.downloadResumeForRecruiter(candidateId, this.jobId).subscribe({
      next: (blob) => {
        this.downloadingResumeFor = null;
        const fileName = `resume-candidate-${candidateId}.pdf`;
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.toastService.show('Resume downloaded', 'success');
      },
      error: (err) => {
        this.downloadingResumeFor = null;
        const msg = err?.status === 403
          ? 'Access denied — you can only download resumes for candidates who applied to your jobs.'
          : 'Resume not available for this candidate.';
        this.toastService.show(msg, 'error');
      }
    });
  }

  get shortlistedCount(): number {
    return this.applications.filter(app => app.status === 'SHORTLISTED').length;
  }

  get rejectedCount(): number {
    return this.applications.filter(app => app.status === 'REJECTED').length;
  }

  openMessageModal(app: RecruiterJobApplicationResponse): void {
    this.selectedApplication = app;
    this.recruiterMessage = '';
    this.showMessageModal = true;
  }

  closeMessageModal(): void {
    this.showMessageModal = false;
    this.selectedApplication = null;
    this.recruiterMessage = '';
  }

  sendMessage(): void {
    if (!this.selectedApplication) {
      return;
    }
    const app = this.selectedApplication;
    const message = this.recruiterMessage.trim();
    if (!message) {
      this.toastService.show('Please enter a message before sending', 'error');
      return;
    }
    if (this.sendingMessageFor.has(app.applicationId)) {
      return;
    }

    this.sendingMessageFor.add(app.applicationId);
    this.notificationService.sendRecruiterMessage({
      candidateId: app.candidateId,
      jobId: this.jobId,
      message
    }).subscribe({
      next: () => {
        this.sendingMessageFor.delete(app.applicationId);
        this.closeMessageModal();
        this.toastService.show('Message sent successfully', 'success');
      },
      error: (error) => {
        this.sendingMessageFor.delete(app.applicationId);
        const msg = error?.error?.message || 'Failed to send message';
        this.toastService.show(msg, 'error');
      }
    });
  }

  isUpdatingStatus(applicationId: number): boolean {
    return this.updatingStatusFor.has(applicationId);
  }

  isSendingMessage(applicationId: number): boolean {
    return this.sendingMessageFor.has(applicationId);
  }
}
