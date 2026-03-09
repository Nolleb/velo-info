import { Injectable, inject, signal } from '@angular/core';
import { StravaService } from './strava.service';
import { FirestoreService } from './firestore.service';
import { MetricsService } from './metrics.service';
import { StoredActivity } from '../models/strava.model';

export interface SyncStatus {
  isInitialized: boolean;
  isSyncing: boolean;
  progress: number;
  totalActivities: number;
  syncedActivities: number;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SyncActivitiesService {
  private stravaService = inject(StravaService);
  private firestoreService = inject(FirestoreService);
  private metricsService = inject(MetricsService);

  syncStatus = signal<SyncStatus>({
    isInitialized: false,
    isSyncing: false,
    progress: 0,
    totalActivities: 0,
    syncedActivities: 0,
    error: null
  });

  async checkInitialization(): Promise<boolean> {
    const stats = await this.firestoreService.getGlobalStats();
    const isInitialized = stats !== null && stats.activityCount > 0;
    this.syncStatus.update(s => ({ ...s, isInitialized }));
    return isInitialized;
  }

  async fullSync(): Promise<void> {
    this.syncStatus.update(s => ({ ...s, isSyncing: true, error: null, progress: 0 }));

    try {
      let page = 1;
      let totalSynced = 0;
      const perPage = 200;

      // Nettoyer complètement toutes les données avant de recommencer
      await this.firestoreService.clearAllData();

      while (true) {
        const activities = await this.stravaService.getActivities(page, perPage);
        
        if (activities.length === 0) break;

        for (const activity of activities) {
          // Filtrer uniquement les activités de type "Ride" (vélo)
          if (activity.type !== 'Ride') {
            console.log(`Activité ignorée (${activity.type}): ${activity.name}`);
            continue;
          }
          
          await this.processActivity(activity);
          totalSynced++;
          this.syncStatus.update(s => ({ 
            ...s, 
            syncedActivities: totalSynced,
            progress: Math.round((totalSynced / (page * perPage)) * 100)
          }));
        }

        if (activities.length < perPage) break;
        page++;
      }

      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false, 
        isInitialized: true,
        totalActivities: totalSynced,
        progress: 100
      }));
    } catch (error) {
      console.error('Sync error:', error);
      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  async incrementalSync(): Promise<void> {
    this.syncStatus.update(s => ({ ...s, isSyncing: true, error: null }));

    try {
      const stats = await this.firestoreService.getGlobalStats();
      if (!stats || !stats.lastActivityDate) {
        throw new Error('No previous sync found. Use full sync first.');
      }

      const after = Math.floor(new Date(stats.lastActivityDate).getTime() / 1000);
      const activities = await this.stravaService.getActivities(1, 200, after);

      // Filtrer uniquement les activités Ride
      const rideActivities = activities.filter(a => a.type === 'Ride');

      for (const activity of rideActivities) {
        await this.processActivity(activity);
      }

      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false,
        syncedActivities: s.syncedActivities + rideActivities.length
      }));
    } catch (error) {
      console.error('Incremental sync error:', error);
      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  async syncLastActivity(): Promise<void> {
    this.syncStatus.update(s => ({ ...s, isSyncing: true, error: null }));

    try {
      // Récupérer les dernières activités (au cas où la dernière n'est pas un Ride)
      const activities = await this.stravaService.getActivities(1, 10);

      if (activities.length === 0) {
        throw new Error('Aucune activité trouvée sur Strava');
      }

      // Trouver la dernière activité de type Ride
      const lastRideActivity = activities.find(a => a.type === 'Ride');
      
      if (!lastRideActivity) {
        throw new Error('Aucune activité de type Ride trouvée dans les dernières activités');
      }

      // Vérifier si cette activité existe déjà
      const existing = await this.firestoreService.getActivity(lastRideActivity.id);
      if (existing) {
        this.syncStatus.update(s => ({ 
          ...s, 
          isSyncing: false,
          error: 'Cette activité est déjà synchronisée'
        }));
        return;
      }

      await this.processActivity(lastRideActivity);

      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false,
        syncedActivities: s.syncedActivities + 1,
        isInitialized: true,
        error: null
      }));
    } catch (error) {
      console.error('Last activity sync error:', error);
      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  async checkForNewActivities(): Promise<boolean> {
    try {
      // Récupérer les dernières activités sur Strava
      const stravaActivities = await this.stravaService.getActivities(1, 10);
      
      if (stravaActivities.length === 0) {
        return false; // Pas d'activités sur Strava
      }

      // Trouver la dernière activité de type Ride
      const latestRideActivity = stravaActivities.find(a => a.type === 'Ride');
      
      if (!latestRideActivity) {
        return false; // Pas d'activité Ride
      }
      
      // Vérifier si cette activité existe déjà dans Firestore
      const existing = await this.firestoreService.getActivity(latestRideActivity.id);
      
      // S'il n'existe pas, il y a une nouvelle activité
      return existing === null;
    } catch (error) {
      console.error('Error checking for new activities:', error);
      return true; // En cas d'erreur, on laisse les boutons actifs
    }
  }

  private async processActivity(activity: any): Promise<void> {
    const metrics = this.metricsService.calculateMetrics(activity);
    const date = new Date(activity.start_date);
    const year = date.getFullYear();
    const month = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    // Récupérer les détails complets (polyline + segments)
    let detailedData: any = {};
    try {
      const detail = await this.stravaService.getActivityDetail(activity.id);
      
      // Filtrer UNIQUEMENT les segments favoris
      const starredSegments = detail.segment_efforts?.filter(
        (effort: any) => effort.segment?.starred === true
      ) || [];
      
      detailedData = {
        map: detail.map,
        segment_efforts: starredSegments
      };
      
      console.log(`✓ Activity ${activity.id}: ${starredSegments.length} starred segments`);
      
      // Délai de 5 secondes (au lieu de 10) pour accélérer
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error: any) {
      // En cas d'erreur (rate limit, etc), on sauvegarde quand même l'activité
      console.warn(`⚠ Activity ${activity.id} without details:`, error.message);
      // Pas de délai si erreur, on continue rapidement
    }
    
    const storedActivity: StoredActivity = {
      ...activity,
      ...detailedData,
      metrics,
      userId: 'default-user',
      month,
      year
    };

    await this.firestoreService.saveActivity(storedActivity);

    // Mettre à jour les stats mensuelles
    await this.firestoreService.updateMonthStats(date.getFullYear(), date.getMonth() + 1, storedActivity);

    // Mettre à jour les stats globales
    await this.firestoreService.updateGlobalStats({
      totalDistance: activity.distance / 1000,
      totalElevation: activity.total_elevation_gain,
      totalTime: activity.moving_time,
      activityCount: 1,
      lastActivityDate: activity.start_date
    });
  }
}
