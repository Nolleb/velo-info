import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./shared/components/header/header.component";
import { FooterComponent } from "./shared/components/footer/footer.component";
import { AuthStore } from './stores/auth/auth.store';
import { SyncActivitiesService } from './services/sync-activities.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('velo-info');

  private authStore = inject(AuthStore);
  private syncService = inject(SyncActivitiesService);

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

  private async autoSyncOnLogin(): Promise<void> {
    const isInitialized = await this.syncService.checkInitialization();
    if (isInitialized) {
      console.log('🔄 Auto-sync des nouvelles activités au démarrage...');
      await this.syncService.incrementalSync();
    }
  }
}
