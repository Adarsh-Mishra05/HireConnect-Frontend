import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionResponse {
  id: number;
  recruiterId: number;
  plan: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  amountPaid: number;
  active: boolean;
}

export interface InvoiceResponse {
  id: number;
  subscriptionId: number;
  recruiterId: number;
  amount: number;
  paymentMode: 'UPI' | 'CARD' | 'WALLET';
  transactionId: string;
  paymentDate: string;
}

export type PlanTier = 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';
export type PaymentMode = 'UPI' | 'CARD' | 'WALLET';

export interface SubscribeRequest {
  plan: PlanTier;
  paymentMode?: PaymentMode;
  transactionId?: string;
}

export interface RenewSubscriptionRequest {
  paymentMode: PaymentMode;
  transactionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private baseUrl = environment.apiBaseUrl + '/subscriptions';

  constructor(private http: HttpClient) {}

  getMySubscription(): Observable<SubscriptionResponse> {
    return this.http.get<SubscriptionResponse>(`${this.baseUrl}/me`);
  }

  getMyInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(`${this.baseUrl}/invoices/me`);
  }

  subscribe(request: SubscribeRequest): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(`${this.baseUrl}/subscribe`, request);
  }

  renew(request: RenewSubscriptionRequest): Observable<SubscriptionResponse> {
    return this.http.put<SubscriptionResponse>(`${this.baseUrl}/renew`, request);
  }

  cancel(): Observable<SubscriptionResponse> {
    return this.http.put<SubscriptionResponse>(`${this.baseUrl}/cancel`, {});
  }
}
