import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { GlobalStats, MonthStats, StoredActivity, SegmentStat, SegmentDateStat } from '../models/strava.model';
import { MetricsService } from './metrics.service';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private metricsService = inject(MetricsService);
  private userId = 'dev-user'; // Simple user ID for development

  // Activités
  async saveActivity(activity: StoredActivity): Promise<void> {
    const activityRef = doc(this.firestore, `users/${this.userId}/activities/${activity.id}`);
    await setDoc(activityRef, activity);
  }

  async getActivity(activityId: number): Promise<StoredActivity | null> {
    const activityRef = doc(this.firestore, `users/${this.userId}/activities/${activityId}`);
    const snapshot = await getDoc(activityRef);
    return snapshot.exists() ? snapshot.data() as StoredActivity : null;
  }

  async getActivitiesByMonth(year: number, month: number): Promise<StoredActivity[]> {
    const monthId = `${year}-${month.toString().padStart(2, '0')}`;
    const activitiesRef = collection(this.firestore, `users/${this.userId}/activities`);
    const snapshot = await getDocs(activitiesRef);
    
    return snapshot.docs
      .map(doc => doc.data() as StoredActivity)
      .filter(activity => activity.month === monthId);
  }

  async getAllActivities(): Promise<StoredActivity[]> {
    const activitiesRef = collection(this.firestore, `users/${this.userId}/activities`);
    const snapshot = await getDocs(activitiesRef);
    return snapshot.docs.map(doc => doc.data() as StoredActivity);
  }

  // ==================== GESTION DES SEGMENTS ====================
  
  /**
   * Récupère les stats d'un segment
   * @param segmentId ID du segment
   * @returns Les stats du segment ou null
   */
  async getSegmentStat(segmentId: number): Promise<SegmentStat | null> {
    const segmentRef = doc(this.firestore, `users/${this.userId}/segmentsStats/${segmentId}`);
    const snapshot = await getDoc(segmentRef);
    return snapshot.exists() ? snapshot.data() as SegmentStat : null;
  }

  /**
   * Enregistre ou met à jour un passage sur un segment
   * @param segmentId ID du segment
   * @param segmentName Nom du segment
   * @param activityId ID de l'activité
   * @param activityDate Date de l'activité (format ISO)
   * @param isStarred Si le segment est favori
   * @param movingTime Temps en mouvement (en secondes, uniquement pour starred)
   */
  async saveSegmentStat(
    segmentId: number,
    segmentName: string,
    activityId: number,
    activityDate: string,
    isStarred: boolean,
    movingTime?: number
  ): Promise<void> {
    const segmentRef = doc(this.firestore, `users/${this.userId}/segmentsStats/${segmentId}`);
    const dateKey = activityDate.split('T')[0]; // Format: YYYY-MM-DD
    
    // Récupérer les stats existantes
    const existingStat = await this.getSegmentStat(segmentId);
    
    if (!existingStat) {
      // Créer un nouveau segment
      const dateData: SegmentDateStat = { 
        count: 1,
        activityIds: [activityId]
      };
      if (isStarred && movingTime) {
        dateData.times = [movingTime];
      }
      
      const newStat: SegmentStat = {
        name: segmentName,
        starred: isStarred,
        dates: {
          [dateKey]: dateData
        }
      };
      
      if (isStarred && movingTime) {
        newStat.bestTimes = [movingTime];
      }
      
      await setDoc(segmentRef, newStat);
      console.log(`✅ Nouveau segment créé: ${segmentName} (${segmentId}) - ${dateKey}`);
    } else {
      // Mettre à jour les stats existantes
      const updatedDates = { ...existingStat.dates };
      
      if (updatedDates[dateKey]) {
        // Date existe déjà : vérifier si l'activité a déjà été enregistrée
        const existingActivityIds = updatedDates[dateKey].activityIds || [];
        
        if (existingActivityIds.includes(activityId)) {
          // L'activité a déjà été enregistrée, on ne fait rien
          console.log(`⚠️ Activity ${activityId} already recorded for segment ${segmentId} on ${dateKey}, skipping...`);
          return;
        }
        
        // Nouvelle activité pour cette date : ajouter
        const dateData: SegmentDateStat = {
          count: updatedDates[dateKey].count + 1,
          activityIds: [...existingActivityIds, activityId]
        };
        
        if (movingTime) {
          const existingTimes = updatedDates[dateKey].times || [];
          dateData.times = [...existingTimes, movingTime];
        } else if (updatedDates[dateKey].times) {
          dateData.times = updatedDates[dateKey].times;
        }
        
        updatedDates[dateKey] = dateData;
      } else {
        // Nouvelle date
        const dateData: SegmentDateStat = { 
          count: 1,
          activityIds: [activityId]
        };
        if (movingTime) {
          dateData.times = [movingTime];
        }
        updatedDates[dateKey] = dateData;
      }
      
      // Mettre à jour les meilleurs temps
      const updateData: any = {
        dates: updatedDates,
        starred: isStarred
      };
      
      if (movingTime) {
        const updatedBestTimes = [...(existingStat.bestTimes || []), movingTime]
          .sort((a, b) => a - b) // Trier par temps croissant
          .slice(0, 3); // Garder les 3 meilleurs
        updateData.bestTimes = updatedBestTimes;
      } else if (existingStat.bestTimes) {
        updateData.bestTimes = existingStat.bestTimes;
      }
      
      await updateDoc(segmentRef, updateData);
    }
  }

  /**
   * Récupère les N meilleurs temps sur un segment starred avant une date donnée
   * @param segmentId ID du segment
   * @param limit Nombre de temps à récupérer
   * @param beforeDate Date limite (ISO format), optionnelle
   * @returns Les meilleurs temps triés
   */
  async getSegmentBestTimes(segmentId: number, limit: number = 3, beforeDate?: string): Promise<number[]> {
    const segmentStat = await this.getSegmentStat(segmentId);
    
    if (!segmentStat || !segmentStat.starred) {
      return [];
    }
    
    // Si pas de filtre de date, retourner bestTimes directement
    if (!beforeDate) {
      return (segmentStat.bestTimes || []).slice(0, limit);
    }
    
    // Avec filtre de date : parcourir les dates et collecter les times
    const cutoffDate = beforeDate.split('T')[0];
    const allTimes: number[] = [];
    
    for (const [dateKey, dateStat] of Object.entries(segmentStat.dates)) {
      // Ne prendre que les dates antérieures ou égales
      if (dateKey < cutoffDate && dateStat.times) {
        allTimes.push(...dateStat.times);
      }
    }
    
    // Trier par temps croissant et prendre les N meilleurs
    return allTimes.sort((a, b) => a - b).slice(0, limit);
  }

  // Stats globales
  async getGlobalStats(): Promise<GlobalStats | null> {
    const statsRef = doc(this.firestore, `users/${this.userId}/stats/global`);
    const snapshot = await getDoc(statsRef);
    return snapshot.exists() ? snapshot.data() as GlobalStats : null;
  }

  async setGlobalStats(stats: GlobalStats): Promise<void> {
    const statsRef = doc(this.firestore, `users/${this.userId}/stats/global`);
    await setDoc(statsRef, stats);
  }

  async recalculateGlobalStats(): Promise<void> {
    const activitiesRef = collection(this.firestore, `users/${this.userId}/activities`);
    const snapshot = await getDocs(activitiesRef);
    
    const activities = snapshot.docs.map(doc => doc.data() as StoredActivity);
    
    if (activities.length === 0) {
      console.log(`📊 No activities, clearing global stats`);
      await this.setGlobalStats({
        totalDistance: 0,
        totalElevation: 0,
        totalTime: 0,
        activityCount: 0,
        lastActivityDate: null,
        lastSyncDate: new Date().toISOString(),
        userId: this.userId
      });
      return;
    }

    // Calculer from scratch
    let totalDistance = 0;
    let totalElevation = 0;
    let totalTime = 0;
    let lastActivityDate: string | null = null;

    for (const activity of activities) {
      totalDistance += activity.distance / 1000; // Convertir en km
      totalElevation += activity.total_elevation_gain;
      totalTime += activity.moving_time;
      
      // Trouver la dernière activité
      if (!lastActivityDate || new Date(activity.start_date) > new Date(lastActivityDate)) {
        lastActivityDate = activity.start_date;
      }
    }

    const stats: GlobalStats = {
      totalDistance,
      totalElevation,
      totalTime,
      activityCount: activities.length,
      lastActivityDate,
      lastSyncDate: new Date().toISOString(),
      userId: this.userId
    };

    console.log(`📊 Recalculated global stats:`, {
      count: activities.length,
      distance: totalDistance.toFixed(2) + ' km',
      elevation: totalElevation + ' m'
    });

    await this.setGlobalStats(stats);
  }

  // Stats mensuelles
  async getMonthStats(year: number, month: number): Promise<MonthStats | null> {
    const monthId = `${year}-${month.toString().padStart(2, '0')}`;
    const monthRef = doc(this.firestore, `users/${this.userId}/months/${monthId}`);
    const snapshot = await getDoc(monthRef);
    return snapshot.exists() ? snapshot.data() as MonthStats : null;
  }

  // Calculer la régularité annuelle
  async calculateYearlyRegularity(year: number): Promise<number> {
    const monthlyScores: number[] = [];
    
    // Récupérer les scores de régularité pour chaque mois de l'année
    for (let month = 1; month <= 12; month++) {
      const monthStats = await this.getMonthStats(year, month);
      if (monthStats && monthStats.regularity) {
        monthlyScores.push(monthStats.regularity);
      }
    }

    if (monthlyScores.length === 0) return 0;

    return this.metricsService.calculateYearlyRegularity(monthlyScores);
  }

  // Recalculer les stats d'un mois depuis toutes les activités (ne plus incrémenter)
  async recalculateMonthStats(year: number, month: number): Promise<void> {
    const monthId = `${year}-${month.toString().padStart(2, '0')}`;
    const monthRef = doc(this.firestore, `users/${this.userId}/months/${monthId}`);
    
    // Récupérer TOUTES les activités du mois
    const activities = await this.getActivitiesByMonth(year, month);
    
    if (activities.length === 0) {
      console.log(`📊 No activities for ${monthId}, clearing stats`);
      await setDoc(monthRef, {
        year,
        month,
        totalDistance: 0,
        totalElevation: 0,
        totalTime: 0,
        activityCount: 0,
        avgIntensity: 'Aucune activité',
        grandFondo: 0,
        regularity: 0,
        userId: this.userId
      });
      return;
    }

    // Calculer from scratch
    let totalDistance = 0;
    let totalElevation = 0;
    let totalTime = 0;
    let grandFondo = 0;

    for (const activity of activities) {
      totalDistance += activity.distance / 1000; // Convertir en km
      totalElevation += activity.total_elevation_gain;
      totalTime += activity.moving_time;
      grandFondo += activity.metrics.grandFondo;
    }

    const count = activities.length;
    
    // Calculer la régularité mensuelle
    const regularity = this.metricsService.calculateMonthlyRegularity(activities);
    
    // Calculer l'intensité moyenne (score médian) puis convertir en profile
    const intensityScore = this.metricsService.calculateMonthlyIntensityScore(activities);
    const avgIntensity = this.metricsService.getIntensityProfile(intensityScore);

    const stats: MonthStats = {
      year,
      month,
      totalDistance,
      totalElevation,
      totalTime,
      activityCount: count,
      avgIntensity,
      grandFondo,
      regularity,
      userId: this.userId
    };

    console.log(`📊 Recalculated stats for ${monthId}:`, {
      count,
      distance: totalDistance.toFixed(2) + ' km',
      elevation: totalElevation + ' m',
      regularity: regularity + '/100',
      avgIntensity,
      grandFondo
    });

    await setDoc(monthRef, stats);
  }

  async setMonthStats(stats: MonthStats): Promise<void> {
    const monthId = `${stats.year}-${stats.month.toString().padStart(2, '0')}`;
    const monthRef = doc(this.firestore, `users/${this.userId}/months/${monthId}`);
    await setDoc(monthRef, stats);
  }

  // Nettoyer toutes les données pour un full sync
  async clearAllData(): Promise<void> {
    // Supprimer toutes les activités
    const activitiesRef = collection(this.firestore, `users/${this.userId}/activities`);
    const activitiesSnapshot = await getDocs(activitiesRef);
    const deleteActivitiesPromises = activitiesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteActivitiesPromises);

    // Supprimer toutes les maps
    const mapsRef = collection(this.firestore, `users/${this.userId}/activity_maps`);
    const mapsSnapshot = await getDocs(mapsRef);
    const deleteMapsPromises = mapsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteMapsPromises);

    // Supprimer tous les mois
    const monthsRef = collection(this.firestore, `users/${this.userId}/months`);
    const monthsSnapshot = await getDocs(monthsRef);
    const deleteMonthsPromises = monthsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteMonthsPromises);

    // Supprimer toutes les stats de segments
    await this.clearSegmentStats();

    // Réinitialiser les stats globales
    await this.setGlobalStats({
      totalDistance: 0,
      totalElevation: 0,
      totalTime: 0,
      activityCount: 0,
      lastActivityDate: null,
      lastSyncDate: new Date().toISOString(),
      userId: this.userId
    });
  }

  // Nettoyer uniquement les stats de segments (pour rebuild)
  async clearSegmentStats(): Promise<void> {
    const segmentsRef = collection(this.firestore, `users/${this.userId}/segmentsStats`);
    const segmentsSnapshot = await getDocs(segmentsRef);
    const deleteSegmentsPromises = segmentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteSegmentsPromises);
    console.log(`🧹 Cleared ${segmentsSnapshot.size} segment stat records`);
  }
}