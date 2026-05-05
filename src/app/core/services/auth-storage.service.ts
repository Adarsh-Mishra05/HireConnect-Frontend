import { Injectable } from '@angular/core';

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: string;
  userId: number;
  fullName?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService {

  saveSession(data: SessionData): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userId', data.userId.toString());
    if (data.fullName) {
      localStorage.setItem('userFullName', data.fullName);
    }
    if (data.phone) {
      localStorage.setItem('userPhone', data.phone);
    }
  }

  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  setUserFullName(fullName: string): void {
    localStorage.setItem('userFullName', fullName);
  }

  getUserFullName(): string | null {
    return localStorage.getItem('userFullName');
  }

  setUserPhone(phone: string): void {
    localStorage.setItem('userPhone', phone);
  }

  getUserPhone(): string | null {
    return localStorage.getItem('userPhone');
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userPhone');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}
