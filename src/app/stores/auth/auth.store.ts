import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private authService = inject(AuthService);

  // Utiliser userWithRole$ pour avoir automatiquement le role
  userWithRole = toSignal(this.authService.userWithRole$, { initialValue: null });
  isAuthenticated = computed(() => !!this.userWithRole());

  getUserId(): string | null {
    return this.userWithRole()?.uid || null;
  }

  getUserEmail(): string | null {
    return this.userWithRole()?.email || null;
  }

  getUserDisplayName(): string | null {
    return this.userWithRole()?.displayName || null;
  }

  getUserPhotoURL(): string | null {
    return this.userWithRole()?.photoURL || null;
  }

  getUserRole(): Role | null {
    const role = this.userWithRole()?.role || null;
    return role;
  }
}
