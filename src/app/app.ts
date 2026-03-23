import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SvgIconDirective } from "./shared/ui/svg/svg-icon.directive";
import { HeaderComponent } from "./shared/components/header/header.component";
import { FooterComponent } from "./shared/components/footer/footer.component";
import { AuthStore } from './stores/auth/auth.store';
import { AuthService } from './services/auth.service';
import { SyncActivitiesService } from './services/sync-activities.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('velo-info');

  private authStore = inject(AuthStore);
  private authService = inject(AuthService);
  private syncService = inject(SyncActivitiesService);

  // Prevents triggering sync more than once per app session
  private hasSynced = false;

  constructor() {
    effect(() => {
      const user = this.authStore.userWithRole();
      if (user && !this.hasSynced) {
        this.hasSynced = true;
        this.autoSyncOnLogin();
      } else if (!user) {
        this.hasSynced = false;
      }
    });
  }

  ngOnInit(): void {
    // Capture OAuth result after Safari redirect flow and upsert the user doc
    this.authService.handleRedirectResult().subscribe();
  }

  private async autoSyncOnLogin(): Promise<void> {
    const isInitialized = await this.syncService.checkInitialization();
    if (isInitialized) {
      console.log('🔄 Auto-sync des nouvelles activités au démarrage...');
      await this.syncService.incrementalSync();
    }
  }
}
