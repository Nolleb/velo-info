import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AuthStore } from '../../../stores/auth/auth.store';
import { SvgIconDirective } from '../../ui/svg/svg-icon.directive';
import { Role } from '../../../models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-button',
  standalone: true,
  templateUrl: './auth-button.component.html',
  styleUrls: ['./auth-button.component.scss'],
  imports: [SvgIconDirective]
})
export class AuthButtonComponent {

  authService = inject(AuthService);
  authStore = inject(AuthStore);
  router = inject(Router);

  role = computed(() => this.authStore.getUserRole());
  roleAdmin = Role.ADMIN

  signInWithGoogle() {
    this.authService.signInWithGoogle().subscribe({
      next: () => {
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
      }
    });
  }

  signOut() {
    this.authService.signOut().subscribe({
      next: () => {
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
      }
    });
  }
}
