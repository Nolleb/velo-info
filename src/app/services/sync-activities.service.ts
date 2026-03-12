import { Injectable, inject, signal } from '@angular/core';
import { StravaService } from './strava.service';
import { FirestoreService } from './firestore.service';
import { MetricsService } from './metrics.service';
import { StoredActivity } from '../models/strava.model';
import { getMainRideZone, getRideZones } from '../shared/utils/stats.utils';

export interface SyncStatus {
  isInitialized: boolean;
  isSyncing: boolean;
  progress: number;
  totalActivities: number;
  syncedActivities: number;
  error: string | null;
  currentYear?: number;
  syncedYears: number[];
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
    error: null,
    syncedYears: []
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

      console.log(`✅ ${totalSynced} activités synchronisées`);
      
      // Recalculer les stats de toutes les années/mois
      console.log(`🔄 Recalcul de toutes les stats...`);
      const allActivities = await this.firestoreService.getAllActivities();
      const yearMonths = new Set<string>();
      
      for (const activity of allActivities) {
        const date = new Date(activity.start_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        yearMonths.add(`${year}-${month}`);
      }
      
      console.log(`🔄 Recalcul des stats pour ${yearMonths.size} mois...`);
      for (const yearMonth of yearMonths) {
        const [year, month] = yearMonth.split('-').map(Number);
        await this.firestoreService.recalculateMonthStats(year, month);
      }
      
      // Recalculer les stats globales
      await this.firestoreService.recalculateGlobalStats();
      console.log(`✅ Toutes les stats recalculées`);

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

      // Collecter les mois affectés pour recalculer les stats
      const affectedMonths = new Set<string>();

      for (const activity of rideActivities) {
        await this.processActivity(activity);
        
        // Ajouter le mois aux mois affectés
        const date = new Date(activity.start_date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        affectedMonths.add(monthKey);
      }

      // Recalculer les stats des mois affectés
      console.log(`🔄 Recalcul des stats pour ${affectedMonths.size} mois...`);
      for (const monthKey of affectedMonths) {
        const [year, month] = monthKey.split('-').map(Number);
        await this.firestoreService.recalculateMonthStats(year, month);
      }

      // Recalculer les stats globales
      await this.firestoreService.recalculateGlobalStats();

      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false,
        syncedActivities: s.syncedActivities + rideActivities.length
      }));
      
      console.log(`✅ Sync incrémentale terminée, stats recalculées`);
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

      await this.processActivity(lastRideActivity);

      // Recalculer les stats du mois de cette activité
      const date = new Date(lastRideActivity.start_date);
      await this.firestoreService.recalculateMonthStats(date.getFullYear(), date.getMonth() + 1);
      await this.firestoreService.recalculateGlobalStats();

      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false,
        syncedActivities: s.syncedActivities + 1,
        isInitialized: true,
        error: null
      }));
      
      console.log(`✅ Dernière activité synchronisée et stats recalculées`);
    } catch (error) {
      console.error('Last activity sync error:', error);
      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  async syncByYear(year: number): Promise<void> {
    this.syncStatus.update(s => ({ 
      ...s, 
      isSyncing: true, 
      error: null, 
      progress: 0,
      currentYear: year 
    }));

    try {
      // Calculer les timestamps de début et fin d'année
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      
      const after = Math.floor(startOfYear.getTime() / 1000);
      const before = Math.floor(endOfYear.getTime() / 1000);

      let page = 1;
      let totalSynced = 0;
      const perPage = 200;

      console.log(`🔄 Synchronisation de l'année ${year}...`);

      while (true) {
        const activities = await this.stravaService.getActivities(page, perPage, after, before);
        
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

      // Marquer l'année comme synchronisée
      this.syncStatus.update(s => ({
        ...s,
        isSyncing: false,
        isInitialized: true,
        progress: 100,
        syncedYears: [...s.syncedYears, year].sort((a, b) => b - a),
        currentYear: undefined
      }));

      console.log(`✅ Année ${year} synchronisée : ${totalSynced} activités`);
      
      // Recalculer les stats de tous les mois de l'année
      console.log(`🔄 Recalcul des stats mensuelles pour ${year}...`);
      for (let month = 1; month <= 12; month++) {
        await this.firestoreService.recalculateMonthStats(year, month);
      }
      
      // Recalculer les stats globales
      console.log(`🔄 Recalcul des stats globales...`);
      await this.firestoreService.recalculateGlobalStats();
      
      console.log(`✅ Stats recalculées pour ${year}`);
      
    } catch (error) {
      console.error(`Erreur sync année ${year}:`, error);
      this.syncStatus.update(s => ({ 
        ...s, 
        isSyncing: false, 
        currentYear: undefined,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  async syncMultipleYears(years: number[]): Promise<void> {
    for (const year of years) {
      await this.syncByYear(year);
      // Petite pause entre les années pour ne pas surcharger
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async getSyncedYears(): Promise<number[]> {
    return this.syncStatus().syncedYears;
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
    console.log(`📊 Processing activity ${activity.id} (${activity.name})`);
    
    const metrics = this.metricsService.calculateMetrics(activity);
    const date = new Date(activity.start_date);
    const year = date.getFullYear();
    const month = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    // Récupérer les détails complets (polyline + segments)
    let detailedData: any = {};
    try {
      const detail = await this.stravaService.getActivityDetail(activity.id);
      const map = await this.stravaService.getActivityMap(activity.id);
      // Filtrer UNIQUEMENT les segments favoris
      const starredSegments = detail.segment_efforts?.filter(
        (effort: any) => effort.segment?.starred === true
      ) || [];

      const latlngData = map.find(s => s.type === 'latlng')?.data ?? [];
      const altitudeData = map.find(s => s.type === 'altitude')?.data ?? [];
      const distanceData = map.find(s => s.type === 'distance')?.data ?? [];

      // Enrichir chaque segment avec les 3 meilleurs temps ET la topologie
      const enrichedSegments = [];
      for (const segment of starredSegments) {
        try {
          // Récupérer l'historique des temps sur ce segment depuis Firestore
          const topEfforts = await this.firestoreService.getTopSegmentEfforts(segment.segment.id, 3);
          
          // Extraire la topologie du segment
          const startIndex = segment.start_index;
          const endIndex = segment.end_index;
          const segmentAltitudes = (altitudeData as number[]).slice(startIndex, endIndex + 1);
          const segmentDistances = (distanceData as number[]).slice(startIndex, endIndex + 1);
          
          enrichedSegments.push({
            ...segment,
            overallRanking: {
              gold: topEfforts[0]?.moving_time ?? null,
              silver: topEfforts[1]?.moving_time ?? null,
              bronze: topEfforts[2]?.moving_time ?? null
            },
            topology: {
              altitudes: segmentAltitudes,
              distances: segmentDistances
            }
          });
        } catch (error) {
          console.warn(`Unable to compute best times for segment ${segment.segment.id}:`, error);
          enrichedSegments.push({
            ...segment,
            overallRanking: { gold: null, silver: null, bronze: null }
          });
        }
      }

      detailedData = {
        main_ride_zone: await getMainRideZone(latlngData),
        list_ride_zone: await getRideZones(latlngData),
        segment_efforts: enrichedSegments
      };
      
      console.log(`✓ Activity ${activity.id}: ${enrichedSegments.length} starred segments`);
    
    } catch (error: any) {
      // En cas d'erreur (rate limit, etc), on sauvegarde quand même l'activité
      console.warn(`⚠ Activity ${activity.id} without details:`, error.message);
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
    console.log(`✅ Activity ${activity.id} saved`);
  }
}
