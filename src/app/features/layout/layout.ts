import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStorageService } from '../../core/services/auth-storage.service';
import { AuthService } from '../../core/services/auth.service';
import {
  NotificationResponse,
  NotificationService
} from '../../core/services/notification.service';

import { ToastService } from '../../core/services/toast.service';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  userRole = '';
  userEmail = '';
  isNotificationPanelOpen = false;

  notifications: NotificationResponse[] = [];
  unreadCount = 0;
  private pollInterval: any;

  constructor(
    private authStorage: AuthStorageService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authStorage.getUserRole() || '';
    this.userEmail = this.authStorage.getUserEmail() || '';

    this.loadNotifications();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    this.pollInterval = setInterval(() => {
      this.notificationService.getUnreadCount().subscribe({
        next: (count) => {
          this.unreadCount = count;
        }
      });
    }, 30000); // 30 seconds
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  get userInitial(): string {
    return this.userEmail?.charAt(0).toUpperCase() || 'U';
  }

  get homeRoute(): string {
    if (this.userRole === 'RECRUITER') {
      return '/recruiter/dashboard';
    }
    if (this.userRole === 'ADMIN') {
      return '/admin/dashboard';
    }
    return '/candidate/dashboard';
  }

  loadNotifications(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: () => {
        this.unreadCount = 0;
        this.toastService.show('Unable to load unread count', 'error');
      }
    });

    this.notificationService.getNotifications(0, 5).subscribe({
      next: (response) => {
        this.notifications = response.content || [];
      },
      error: () => {
        this.notifications = [];
        this.toastService.show('Unable to load notifications', 'error');
      }
    });
  }

  toggleNotifications(): void {
    this.isNotificationPanelOpen = !this.isNotificationPanelOpen;

    if (this.isNotificationPanelOpen) {
      this.loadNotifications();
    }
  }

  closeNotifications(): void {
    this.isNotificationPanelOpen = false;
  }

  markAsRead(notification: NotificationResponse): void {
    if (notification.isRead) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount = Math.max(this.unreadCount - 1, 0);
      },
      error: () => {
        this.toastService.show('Unable to update notification', 'error');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.toastService.show('Logout successfully', 'success');
  }
}
