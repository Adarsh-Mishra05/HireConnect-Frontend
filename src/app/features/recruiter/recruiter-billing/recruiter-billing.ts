import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentResponse, PaymentService } from '../../../core/services/payment.service';
import { FormsModule } from '@angular/forms';
import { InvoiceResponse, SubscriptionService } from '../../../core/services/subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthStorageService } from '../../../core/services/auth-storage.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-recruiter-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruiter-billing.html',
  styleUrl: './recruiter-billing.css'
})
export class RecruiterBillingComponent implements OnInit {
  payments: PaymentResponse[] = [];
  invoices: InvoiceResponse[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private paymentService: PaymentService,
    private subscriptionService: SubscriptionService,
    private authStorage: AuthStorageService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const isRecruiter = this.authStorage.getUserRole() === 'RECRUITER';

    forkJoin({
      payments: this.paymentService.getMyPayments().pipe(catchError(() => of([]))),
      invoices: isRecruiter
        ? this.subscriptionService.getMyInvoices().pipe(catchError(() => of([])))
        : of([])
    }).subscribe({
      next: ({ payments, invoices }) => {
        this.payments = Array.isArray(payments) ? payments : [];
        this.invoices = Array.isArray(invoices) ? invoices : [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load payments:', error);
        this.errorMessage =
          error?.error?.message ||
          error?.message ||
          'Failed to load payment history';
        this.payments = [];
        this.isLoading = false;
        this.toastService.show(this.errorMessage, 'error');
      }
    });
  }

  get successCount(): number {
    return this.payments.filter(payment => payment.status === 'SUCCESS').length;
  }

  get failedCount(): number {
    return this.payments.filter(payment => payment.status === 'FAILED').length;
  }

  get createdCount(): number {
    return this.payments.filter(payment => payment.status === 'CREATED').length;
  }

  get totalAmountPaid(): number {
    return this.payments
      .filter(payment => payment.status === 'SUCCESS')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }

  get totalInvoicedAmount(): number {
    return this.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  }

  formatPurpose(purpose: string): string {
  return purpose
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
  }
}
