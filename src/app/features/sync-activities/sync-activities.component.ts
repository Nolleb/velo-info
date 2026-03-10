import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncActivitiesService } from '../../services/sync-activities.service';

@Component({
  selector: 'app-sync',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sync-container">
      <h2>Synchronisation Strava</h2>
      
      @if (isLoading()) {
        <div class="loading-section">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
      }
      
      @if (!isLoading() && !status().isInitialized && !status().isSyncing) {
        <div class="init-section">
          <p>Aucune donnée trouvée. Voulez-vous lancer la synchronisation complète ?</p>
          <button (click)="startFullSync()" class="btn-primary">
            🚀 Synchronisation complète
          </button>
          <p class="warning">⚠️ Cette opération peut prendre plusieurs minutes</p>
        </div>
      }

      @if (!isLoading() && status().isInitialized && !status().isSyncing) {
        <div class="sync-section">
          <div class="stats">
            <p>✅ {{ status().totalActivities }} activités synchronisées</p>
            <p>📅 Dernière sync : {{ lastSync() }}</p>
            @if (isChecking()) {
              <p class="info">🔍 Vérification...</p>
            } @else {
              @if (!hasNewActivities()) {
                <p class="info">✓ Toutes vos activités sont synchronisées</p>
              } @else {
                <p class="info">🆕 Nouvelles activités disponibles</p>
              }
            }
          </div>
          <div class="button-group">
            <button 
              (click)="syncLast()" 
              class="btn-primary"
              [disabled]="!hasNewActivities() && !isChecking()">
              ⚡ Dernière activité
            </button>
            <button 
              (click)="startIncrementalSync()" 
              class="btn-secondary"
              [disabled]="!hasNewActivities() && !isChecking()">
              🔄 Nouvelles activités
            </button>
          </div>
          <div class="resync-section">
            <p class="resync-info">💡 Métriques mises à jour ? Recalculez tout</p>
            <button (click)="forceResync()" class="btn-warning">
              ♻️ Re-synchroniser tout
            </button>
          </div>
        </div>
      }

      @if (status().isSyncing) {
        <div class="syncing">
          <div class="spinner"></div>
          <p>Synchronisation en cours...</p>
          <p>{{ status().syncedActivities }} activités traitées</p>
          <div class="progress-bar">
            <div class="progress" [style.width.%]="status().progress"></div>
          </div>
        </div>
      }

      @if (status().error) {
        <div class="error">
          ❌ Erreur : {{ status().error }}
        </div>
      }
    </div>
  `,
  styles: [`
    .sync-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin-bottom: 1.5rem;
      color: #333;
    }

    .init-section, .sync-section {
      text-align: center;
    }

    .loading-section {
      text-align: center;
      padding: 3rem 0;
    }

    .loading-section p {
      color: #666;
      margin-top: 1rem;
    }

    .stats {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .stats p {
      margin: 0.5rem 0;
      font-size: 1.1rem;
    }

    button {
      padding: 12px 24px;
      font-size: 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .button-group button {
      flex: 1;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button:disabled:hover {
      background: inherit;
      transform: none;
    }

    .info {
      color: #4CAF50;
      font-weight: 500;
      margin-top: 0.5rem;
    }

    .btn-primary {
      background: #fc4c02;
      color: white;
    }

    .btn-primary:hover {
      background: #e63900;
    }

    .btn-secondary {
      background: #2196F3;
      color: white;
    }

    .btn-secondary:hover {
      background: #1976D2;
    }

    .btn-warning {
      background: #FF9800;
      color: white;
      width: 100%;
    }

    .btn-warning:hover {
      background: #F57C00;
    }

    .resync-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }

    .resync-info {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .warning {
      margin-top: 1rem;
      color: #ff9800;
      font-size: 0.9rem;
    }

    .syncing {
      text-align: center;
    }

    .spinner {
      margin: 1rem auto;
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #fc4c02;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .progress-bar {
      width: 100%;
      height: 20px;
      background: #f3f3f3;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .progress {
      height: 100%;
      background: linear-gradient(90deg, #fc4c02, #ff6b35);
      transition: width 0.3s;
    }

    .error {
      padding: 1rem;
      background: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin-top: 1rem;
    }
  `]
})
export class SyncActivitiesComponent {
  private syncService = inject(SyncActivitiesService);
  
  status = this.syncService.syncStatus;
  hasNewActivities = signal<boolean>(true); // Démarre à true, sera désactivé si besoin
  isChecking = signal<boolean>(true); // On démarre en mode checking
  isLoading = signal<boolean>(true); // Loading initial
  
  lastSync = computed(() => {
    // Formater la date de dernière sync
    return new Date().toLocaleDateString('fr-FR');
  });

  constructor() {
    // Vérifier l'initialisation au chargement
    this.syncService.checkInitialization().then(() => {
      // Une fois initialisé, vérifier s'il y a de nouvelles activités
      this.checkForNewActivities();
      // Arrêter le loading
      this.isLoading.set(false);
    });
  }

  async checkForNewActivities(): Promise<void> {
    if (this.status().isInitialized) {
      this.isChecking.set(true);
      const hasNew = await this.syncService.checkForNewActivities();
      this.hasNewActivities.set(hasNew);
      this.isChecking.set(false);
    } else {
      // Si pas encore initialisé, on arrête la vérification
      this.isChecking.set(false);
    }
  }

  startFullSync(): void {
    if (confirm('Voulez-vous vraiment lancer une synchronisation complète ? Cela peut prendre plusieurs minutes.')) {
      this.syncService.fullSync();
    }
  }

  forceResync(): void {
    if (confirm(
      '⚠️ Attention : Cette opération va re-synchroniser TOUTES vos activités et recalculer toutes les métriques.\n\n' +
      'Cela prendra plusieurs minutes.\n\n' +
      'Continuer ?'
    )) {
      this.syncService.fullSync();
    }
  }

  async syncLast(): Promise<void> {
    await this.syncService.syncLastActivity();
    // Revérifier après la sync
    this.checkForNewActivities();
  }

  async startIncrementalSync(): Promise<void> {
    await this.syncService.incrementalSync();
    // Revérifier après la sync
    this.checkForNewActivities();
  }
}