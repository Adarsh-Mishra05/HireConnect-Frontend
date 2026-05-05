import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStorageService } from '../services/auth-storage.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStorage = inject(AuthStorageService);

  const token = authStorage.getAccessToken();
  const userRole = authStorage.getUserRole();

  if (!token) {
    router.navigate(['/admin/login']);
    return false;
  }

  if (userRole !== 'ADMIN') {
    router.navigate(['/admin/login']);
    return false;
  }

  return true;
};
