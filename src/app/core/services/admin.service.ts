import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  userId: number;
  email: string;
  fullName: string;
  role: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAnalytics {
  totalJobs: number;
  totalApplications: number;
  totalInterviews: number;
  shortlistedCount: number;
  offeredCount: number;
  rejectedCount: number;
  interviewsCompleted: number;
  avgTimeToHireDays: number;
}

export interface AdminJob {
  jobId: number;
  title: string;
  companyName: string;
  location: string;
  status: string;
  recruiterId: number;
  createdAt?: string;
}

export interface AdminPayment {
  id: number;
  purpose: string;
  referenceId: number;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

export interface AdminPaymentSummary {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalRevenue: number;
}

export interface AdminSubscription {
  id: number;
  recruiterId: number;
  plan: string;
  startDate: string;
  endDate: string;
  status: string;
  amountPaid: number;
  active: boolean;
}

export interface AdminInvoice {
  id: number;
  subscriptionId: number;
  recruiterId: number;
  amount: number;
  paymentMode: string;
  transactionId: string;
  paymentDate: string;
}

export interface AdminSubscriptionSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  totalInvoices: number;
  totalInvoicedAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private usersBaseUrl = 'http://localhost:8080/api/admin/users';
  private jobsBaseUrl = 'http://localhost:8080/api/jobs';
  private paymentsBaseUrl = 'http://localhost:8080/api/payments';
  private analyticsBaseUrl = 'http://localhost:8080/api/analytics';
  private subscriptionsBaseUrl = 'http://localhost:8080/api/subscriptions';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.usersBaseUrl);
  }

  updateUserStatus(userId: number, active: boolean): Observable<AdminUser> {
    const params = new HttpParams().set('active', String(active));
    return this.http.patch<AdminUser>(`${this.usersBaseUrl}/${userId}/status`, null, { params });
  }

  getAllJobs(): Observable<AdminJob[]> {
    return this.http.get<AdminJob[]>(`${this.jobsBaseUrl}/admin/all`);
  }

  updateJobStatus(jobId: number, status: 'OPEN' | 'CLOSED'): Observable<AdminJob> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<AdminJob>(`${this.jobsBaseUrl}/admin/${jobId}/status`, null, { params });
  }

  deleteJob(jobId: number): Observable<string> {
    return this.http.delete(`${this.jobsBaseUrl}/admin/${jobId}`, { responseType: 'text' });
  }

  getAllPayments(): Observable<AdminPayment[]> {
    return this.http.get<AdminPayment[]>(`${this.paymentsBaseUrl}/admin/all`);
  }

  getPaymentSummary(): Observable<AdminPaymentSummary> {
    return this.http.get<AdminPaymentSummary>(`${this.paymentsBaseUrl}/admin/summary`);
  }

  getAllSubscriptions(): Observable<AdminSubscription[]> {
    return this.http.get<AdminSubscription[]>(`${this.subscriptionsBaseUrl}/admin/all`);
  }

  getAllInvoices(): Observable<AdminInvoice[]> {
    return this.http.get<AdminInvoice[]>(`${this.subscriptionsBaseUrl}/admin/invoices`);
  }

  getSubscriptionSummary(): Observable<AdminSubscriptionSummary> {
    return this.http.get<AdminSubscriptionSummary>(`${this.subscriptionsBaseUrl}/admin/summary`);
  }

  getPlatformAnalytics(): Observable<AdminAnalytics> {
    return this.http.get<AdminAnalytics>(`${this.analyticsBaseUrl}/admin`);
  }

  exportPlatformAnalyticsCsv(): Observable<string> {
    return this.http.get(`${this.analyticsBaseUrl}/admin/export`, { responseType: 'text' });
  }
}
