import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterviewResponse, InterviewService } from '../../../../core/services/interview.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-candidate-interviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidate-interviews.html',
  styleUrl: './candidate-interviews.css'
})
export class CandidateInterviewsComponent implements OnInit {
  interviews: InterviewResponse[] = [];
  visibleInterviews: InterviewResponse[] = [];
  isLoading = false;

  constructor(
    public interviewService: InterviewService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadInterviews();
  }

  loadInterviews(): void {
    this.isLoading = true;

    this.interviewService.getCandidateInterviews().subscribe({
      next: (response) => {
        this.interviews = response || [];
        this.visibleInterviews = this.interviews.filter(
          interview =>
            interview.status === 'SCHEDULED' ||
            interview.status === 'CONFIRMED' ||
            interview.status === 'RESCHEDULED' ||
            interview.status === 'CANCELLED'
        );
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastService.show('Failed to load interviews', 'error');
      }
    });
  }

  get totalCount(): number {
    return this.visibleInterviews.length;
  }

  get scheduledCount(): number {
    return this.visibleInterviews.filter(
      interview => interview.status === 'SCHEDULED' || interview.status === 'CONFIRMED'
    ).length;
  }

  get cancelledCount(): number {
    return this.visibleInterviews.filter(interview => interview.status === 'CANCELLED').length;
  }

  get onlineCount(): number {
    return this.visibleInterviews.filter(interview => interview.interviewType === 'ONLINE').length;
  }

  formatType(type: string): string {
    return this.interviewService.formatInterviewType(type);
  }

  getInterviewTitle(interview: InterviewResponse): string {
    return interview.title || 'Interview';
  }

  getSubtitle(interview: InterviewResponse): string {
    if (interview.jobId) {
      return `For Job #${interview.jobId}`;
    }

    return `Application #${interview.applicationId}`;
  }

  getModeText(interview: InterviewResponse): string {
    if (interview.interviewType === 'ONLINE' && interview.meetingLink) {
      return interview.meetingLink;
    }

    if (interview.interviewType === 'OFFLINE' && interview.location) {
      return interview.location;
    }

    if (interview.modeDetails) {
      return interview.modeDetails;
    }

    return '';
  }

  confirmInterview(interviewId: number): void {
    this.interviewService.confirmInterview(interviewId).subscribe({
      next: () => {
        this.toastService.show('Interview confirmed', 'success');
        this.loadInterviews();
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to confirm interview';
        this.toastService.show(message, 'error');
      }
    });
  }

  showRescheduleModal = false;
  rescheduleInterviewId: number | null = null;
  rescheduleDate = '';
  rescheduleReason = '';

  openRescheduleModal(interviewId: number): void {
    this.rescheduleInterviewId = interviewId;
    this.showRescheduleModal = true;
    this.rescheduleDate = '';
    this.rescheduleReason = '';
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.rescheduleInterviewId = null;
    this.rescheduleDate = '';
    this.rescheduleReason = '';
  }

  submitReschedule(): void {
    if (!this.rescheduleInterviewId || !this.rescheduleDate) {
      this.toastService.show('Please select a new date and time', 'error');
      return;
    }

    const parsedDate = new Date(this.rescheduleDate);
    if (Number.isNaN(parsedDate.getTime())) {
      this.toastService.show('Invalid date-time format', 'error');
      return;
    }
    const requestedScheduledAt = parsedDate.toISOString();

    this.interviewService.requestReschedule(this.rescheduleInterviewId, {
      requestedScheduledAt,
      reason: this.rescheduleReason
    }).subscribe({
      next: () => {
        this.toastService.show('Reschedule request submitted', 'success');
        this.loadInterviews();
        this.closeRescheduleModal();
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to request reschedule';
        this.toastService.show(message, 'error');
      }
    });
  }
}
