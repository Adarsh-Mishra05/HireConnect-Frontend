import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AdminAnalytics,
  AdminInvoice,
  AdminJob,
  AdminPayment,
  AdminPaymentSummary,
  AdminService,
  AdminSubscription,
  AdminSubscriptionSummary,
  AdminUser
} from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  errorMessage = '';

  users: AdminUser[] = [];
  jobs: AdminJob[] = [];
  payments: AdminPayment[] = [];
  subscriptions: AdminSubscription[] = [];
  invoices: AdminInvoice[] = [];
  analytics: AdminAnalytics | null = null;
  paymentSummary: AdminPaymentSummary | null = null;
  subscriptionSummary: AdminSubscriptionSummary | null = null;
  userQuery = '';
  jobQuery = '';
  paymentQuery = '';

  activeTab: 'overview' | 'users' | 'jobs' | 'payments' | 'subscriptions' = 'overview';

  setTab(tab: 'overview' | 'users' | 'jobs' | 'payments' | 'subscriptions'): void {
    this.activeTab = tab;
  }

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      analytics: this.adminService.getPlatformAnalytics().pipe(catchError(e => { console.error('Analytics error:', e); return of(null); })),
      users: this.adminService.getUsers().pipe(catchError(e => { console.error('Users error:', e); return of([]); })),
      jobs: this.adminService.getAllJobs().pipe(catchError(e => { console.error('Jobs error:', e); return of([]); })),
      payments: this.adminService.getAllPayments().pipe(catchError(e => { console.error('Payments error:', e); return of([]); })),
      paymentSummary: this.adminService.getPaymentSummary().pipe(catchError(e => { console.error('Payment summary error:', e); return of(null); })),
      subscriptions: this.adminService.getAllSubscriptions().pipe(catchError(e => { console.error('Subscriptions error:', e); return of([]); })),
      invoices: this.adminService.getAllInvoices().pipe(catchError(e => { console.error('Invoices error:', e); return of([]); })),
      subscriptionSummary: this.adminService.getSubscriptionSummary().pipe(catchError(e => { console.error('Subscription summary error:', e); return of(null); }))
    }).subscribe({
      next: ({ analytics, users, jobs, payments, paymentSummary, subscriptions, invoices, subscriptionSummary }) => {
        this.analytics = analytics;
        this.users = (users || []).map(user => this.normalizeUser(user));
        this.jobs = jobs;
        this.payments = payments;
        this.paymentSummary = paymentSummary;
        this.subscriptions = subscriptions;
        this.invoices = invoices;
        this.subscriptionSummary = subscriptionSummary;
        this.loading = false;
        
        if (!analytics && users.length === 0 && jobs.length === 0 && payments.length === 0) {
           this.errorMessage = 'Failed to load any admin dashboard data. Check console for details.';
        } else if (!analytics || users.length === 0 || jobs.length === 0 || payments.length === 0) {
           this.errorMessage = 'Warning: Some dashboard data failed to load. Check console for details.';
        }
      },
      error: (err) => {
        console.error('Fatal dashboard error', err);
        this.errorMessage = 'Critical failure loading admin dashboard data';
        this.loading = false;
      }
    });
  }

  private normalizeUser(user: AdminUser): AdminUser {
    const fullName = (user?.fullName || '').trim();
    const emailName = (user?.email || '').split('@')[0]?.trim() || '';

    return {
      ...user,
      fullName: fullName || emailName || 'Unknown User',
      email: user?.email || 'N/A',
      role: user?.role || 'UNKNOWN',
      provider: user?.provider || 'N/A'
    };
  }

  getUserInitial(user: AdminUser): string {
    return (user?.fullName || '?').charAt(0).toUpperCase() || '?';
  }

  toggleUserStatus(user: AdminUser): void {
    const nextStatus = !user.isActive;
    this.adminService.updateUserStatus(user.userId, nextStatus).subscribe({
      next: (updated) => {
        user.isActive = updated.isActive;
        this.toastService.show(
          updated.isActive ? 'User activated successfully' : 'User suspended successfully',
          'success'
        );
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to update user status';
        this.toastService.show(message, 'error');
      }
    });
  }

  toggleJobStatus(job: AdminJob): void {
    const nextStatus: 'OPEN' | 'CLOSED' = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    this.adminService.updateJobStatus(job.jobId, nextStatus).subscribe({
      next: (updated) => {
        job.status = updated.status;
        this.toastService.show(`Job marked as ${updated.status}`, 'success');
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to update job status';
        this.toastService.show(message, 'error');
      }
    });
  }

  removeJob(job: AdminJob): void {
    this.adminService.deleteJob(job.jobId).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.jobId !== job.jobId);
        this.toastService.show('Job deleted successfully', 'success');
      },
      error: (error) => {
        const message = error?.error?.message || 'Failed to delete job';
        this.toastService.show(message, 'error');
      }
    });
  }

  exportAnalyticsCsv(): void {
    this.adminService.exportPlatformAnalyticsCsv().subscribe({
      next: (csv) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'platform-analytics.csv';
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.toastService.show('Analytics CSV exported', 'success');
      },
      error: () => {
        this.toastService.show('Failed to export analytics CSV', 'error');
      }
    });
  }

  get filteredUsers(): AdminUser[] {
    const q = this.userQuery.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(user =>
      `${user.userId}`.includes(q)
      || (user.fullName || '').toLowerCase().includes(q)
      || (user.email || '').toLowerCase().includes(q)
      || (user.role || '').toLowerCase().includes(q)
      || (user.provider || '').toLowerCase().includes(q)
    );
  }

  get filteredJobs(): AdminJob[] {
    const q = this.jobQuery.trim().toLowerCase();
    if (!q) return this.jobs;
    return this.jobs.filter(job =>
      `${job.jobId}`.includes(q)
      || (job.title || '').toLowerCase().includes(q)
      || (job.companyName || '').toLowerCase().includes(q)
      || (job.location || '').toLowerCase().includes(q)
      || (job.status || '').toLowerCase().includes(q)
      || `${job.recruiterId}`.includes(q)
    );
  }

  get filteredPayments(): AdminPayment[] {
    const q = this.paymentQuery.trim().toLowerCase();
    if (!q) return this.payments;
    return this.payments.filter(payment =>
      `${payment.id}`.includes(q)
      || (payment.purpose || '').toLowerCase().includes(q)
      || `${payment.referenceId}`.includes(q)
      || `${payment.amount}`.includes(q)
      || (payment.currency || '').toLowerCase().includes(q)
      || (payment.status || '').toLowerCase().includes(q)
    );
  }

  get mappedPaymentStatus(): { [k: string]: string } {
    return {
      SUCCESS: 'Completed',
      FAILED: 'Failed',
      CREATED: 'Pending'
    };
  }
}
