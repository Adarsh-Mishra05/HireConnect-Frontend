import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStorageService } from '../services/auth-storage.service';

export const recruiterGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStorage = inject(AuthStorageService);

  const token = authStorage.getAccessToken();
  const userRole = authStorage.getUserRole();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  if (userRole !== 'RECRUITER') {
    router.navigate(['/candidate/dashboard']);
    return false;
  }

  return true;
};

