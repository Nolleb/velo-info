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
          <p>Aucune donnée trouvée. Synchronisez vos activités par année pour éviter d'exploser vos quotas.</p>
          <div class="year-sync-section">
            <h3>📅 Synchronisation par année</h3>
            <p class="info-text">Recommandé : synchronisez une année à la fois pour économiser vos quotas Strava et Firestore</p>
            <div class="years-grid">
              @for (year of availableYears; track year) {
                <button 
                  (click)="syncYear(year)" 
                  [disabled]="status().isSyncing"
                  [class.synced]="isYearSynced(year)"
                  [class.syncing]="status().currentYear === year"
                  class="year-btn">
                  @if (status().currentYear === year) {
                    <span class="spinner-small"></span>
                  }
                  @if (isYearSynced(year)) {
                    ✓
                  }
                  {{ year }}
                </button>
              }
            </div>
            <button 
              (click)="syncAllYears()" 
              [disabled]="status().isSyncing"
              class="btn-sync-all">
              🔄 Synchroniser toutes les années
            </button>
          </div>
        </div>
      }

      @if (!isLoading() && status().isInitialized && !status().isSyncing) {
        <div class="sync-section">
          <div class="stats">
            <p>✅ {{ status().totalActivities }} activités synchronisées</p>
            <p>📅 Dernière sync : {{ lastSync() }}</p>
            @if (status().syncedYears.length > 0) {
              <p>📊 Années synchronisées : {{ status().syncedYears.join(', ') }}</p>
            }
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
          
          <div class="year-sync-section">
            <h3>📅 Re-synchroniser par année</h3>
            <p class="info-text">Vous pouvez re-synchroniser une année spécifique si nécessaire</p>
            <div class="years-grid">
              @for (year of availableYears; track year) {
                <button 
                  (click)="syncYear(year)" 
                  [disabled]="status().isSyncing"
                  [class.synced]="isYearSynced(year)"
                  [class.syncing]="status().currentYear === year"
                  class="year-btn">
                  @if (status().currentYear === year) {
                    <span class="spinner-small"></span>
                  }
                  @if (isYearSynced(year)) {
                    ✓
                  }
                  {{ year }}
                </button>
              }
            </div>
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

          <div class="rebuild-section">
            <h3>🔧 Maintenance</h3>
            <p class="info-text">Recalculer les statistiques des segments à partir des activités déjà enregistrées (sans appeler Strava)</p>
            <button 
              (click)="rebuildSegments()" 
              class="btn-rebuild"
              [disabled]="status().isSyncing || isRebuilding()">
              @if (isRebuilding()) {
                <span class="spinner-small"></span> Reconstruction en cours...
              } @else {
                🔨 Reconstruire les stats de segments
              }
            </button>
            
            <p class="info-text" style="margin-top: 20px;">Recalculer les classements (gold/silver/bronze) des activités depuis les stats de segments (à faire APRÈS la reconstruction)</p>
            <button 
              (click)="refreshRankings()" 
              class="btn-rebuild"
              [disabled]="status().isSyncing || isRefreshing()">
              @if (isRefreshing()) {
                <span class="spinner-small"></span> Actualisation en cours...
              } @else {
                🔄 Actualiser les classements
              }
            </button>
          </div>
        </div>
      }

      @if (status().isSyncing) {
        <div class="syncing">
          <div class="spinner"></div>
          @if (status().currentYear) {
            <p>Synchronisation de l'année {{ status().currentYear }}...</p>
          } @else {
            <p>Synchronisation en cours...</p>
          }
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

    .year-sync-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .year-sync-section h3 {
      margin-bottom: 0.5rem;
      color: #333;
      font-size: 1.2rem;
    }

    .info-text {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .years-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .year-btn {
      padding: 1rem;
      background: white;
      border: 2px solid #e0e0e0;
      color: #333;
      font-weight: 500;
      font-size: 1rem;
      transition: all 0.3s;
      position: relative;
    }

    .year-btn:hover:not(:disabled) {
      background: #fc4c02;
      color: white;
      border-color: #fc4c02;
      transform: translateY(-2px);
    }

    .year-btn.synced {
      background: #4CAF50;
      color: white;
      border-color: #4CAF50;
    }

    .year-btn.syncing {
      background: #2196F3;
      color: white;
      border-color: #2196F3;
    }

    .spinner-small {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 5px;
    }

    .btn-sync-all {
      width: 100%;
      background: #fc4c02;
      color: white;
      padding: 12px 24px;
      font-size: 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-sync-all:hover:not(:disabled) {
      background: #e63900;
    }

    .btn-sync-all:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .rebuild-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f0f7ff;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
    }

    .rebuild-section h3 {
      margin-bottom: 0.5rem;
      color: #333;
      font-size: 1.1rem;
    }

    .btn-rebuild {
      width: 100%;
      background: #2196F3;
      color: white;
      padding: 12px 24px;
      font-size: 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-rebuild:hover:not(:disabled) {
      background: #1976D2;
    }

    .btn-rebuild:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class SyncActivitiesComponent {
  private syncService = inject(SyncActivitiesService);
  
  status = this.syncService.syncStatus;
  hasNewActivities = signal<boolean>(true); // Démarre à true, sera désactivé si besoin
  isChecking = signal<boolean>(true); // On démarre en mode checking
  isLoading = signal<boolean>(true); // Loading initial
  isRebuilding = signal<boolean>(false); // Pour la reconstruction de segments
  isRefreshing = signal<boolean>(false); // Pour l'actualisation des classements
  
  // Années disponibles de 2019 à l'année courante
  availableYears: number[] = Array.from(
    { length: new Date().getFullYear() - 2018 }, 
    (_, i) => new Date().getFullYear() - i
  );
  
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

  async syncYear(year: number): Promise<void> {
    if (confirm(`Synchroniser toutes les activités de ${year} ?`)) {
      await this.syncService.syncByYear(year);
    }
  }

  async syncAllYears(): Promise<void> {
    if (confirm(
      '⚠️ Attention : Cette opération va synchroniser TOUTES les années disponibles.\n\n' +
      'Cela prendra plusieurs minutes et consommera vos quotas.\n\n' +
      'Préférez synchroniser année par année.\n\n' +
      'Continuer ?'
    )) {
      await this.syncService.syncMultipleYears(this.availableYears);
    }
  }

  isYearSynced(year: number): boolean {
    return this.status().syncedYears.includes(year);
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

  async rebuildSegments(): Promise<void> {
    if (!confirm(
      '🔨 Reconstruction des statistiques de segments\n\n' +
      'Cette opération va :\n' +
      '• Nettoyer toutes les stats de segments actuelles\n' +
      '• Les recalculer à partir des activités déjà stockées\n' +
      '• Corriger les doublons éventuels\n\n' +
      '⚠️ Aucun appel à Strava ne sera effectué.\n\n' +
      'Continuer ?'
    )) {
      return;
    }

    this.isRebuilding.set(true);
    
    try {
      await this.syncService.rebuildSegmentStats();
      alert('✅ Statistiques de segments reconstruites avec succès !');
    } catch (error) {
      console.error('Error rebuilding segments:', error);
      alert('❌ Erreur lors de la reconstruction : ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      this.isRebuilding.set(false);
    }
  }

  async refreshRankings(): Promise<void> {
    if (!confirm(
      '🔄 Actualisation des classements\n\n' +
      'Cette opération va :\n' +
      '• Recalculer les classements (gold/silver/bronze) de toutes les activités\n' +
      '• À partir des statistiques de segments actuelles\n' +
      '• Sans appeler Strava\n\n' +
      '⚠️ À faire APRÈS avoir reconstruit les stats de segments.\n\n' +
      'Continuer ?'
    )) {
      return;
    }

    this.isRefreshing.set(true);
    
    try {
      await this.syncService.refreshActivitiesRankings();
      alert('✅ Classements actualisés avec succès !');
    } catch (error) {
      console.error('Error refreshing rankings:', error);
      alert('❌ Erreur lors de l\'actualisation : ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      this.isRefreshing.set(false);
    }
  }
}