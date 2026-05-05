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
  paymentMode: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';
  transactionId: string;
  paymentDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private baseUrl = 'http://localhost:8080/api/subscriptions';

  constructor(private http: HttpClient) {}

  getMySubscription(): Observable<SubscriptionResponse> {
    return this.http.get<SubscriptionResponse>(`${this.baseUrl}/me`);
  }

  getMyInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(`${this.baseUrl}/invoices/me`);
  }
}
