import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from '@angular/fire/firestore';
import { GlobalStats, MonthStats, StoredActivity } from '../models/strava.model';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
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

  // Récupérer les N meilleurs temps sur un segment
  async getTopSegmentEfforts(segmentId: number, limit: number = 3): Promise<any[]> {
    const activitiesRef = collection(this.firestore, `users/${this.userId}/activities`);
    const snapshot = await getDocs(activitiesRef);
    
    const allEfforts: any[] = [];
    
    // Parcourir toutes les activités pour trouver les efforts sur ce segment
    snapshot.docs.forEach(doc => {
      const activity = doc.data() as StoredActivity;
      if (activity.segment_efforts) {
        activity.segment_efforts.forEach(effort => {
          if (effort.segment.id === segmentId) {
            allEfforts.push({
              moving_time: effort.moving_time,
              elapsed_time: effort.elapsed_time,
              start_date: effort.start_date,
              activity_id: activity.id
            });
          }
        });
      }
    });
    
    // Trier par temps et prendre les N meilleurs
    return allEfforts
      .sort((a, b) => a.moving_time - b.moving_time)
      .slice(0, limit);
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
        avgIntensity: 0,
        avgFatigue: 0,
        userId: this.userId
      });
      return;
    }

    // Calculer from scratch
    let totalDistance = 0;
    let totalElevation = 0;
    let totalTime = 0;
    let totalIntensity = 0;
    let totalFatigue = 0;

    for (const activity of activities) {
      totalDistance += activity.distance / 1000; // Convertir en km
      totalElevation += activity.total_elevation_gain;
      totalTime += activity.moving_time;
      totalIntensity += activity.metrics.intensity;
      totalFatigue += activity.metrics.fatigue;
    }

    const count = activities.length;

    const stats: MonthStats = {
      year,
      month,
      totalDistance,
      totalElevation,
      totalTime,
      activityCount: count,
      avgIntensity: totalIntensity / count,
      avgFatigue: totalFatigue / count,
      userId: this.userId
    };

    console.log(`📊 Recalculated stats for ${monthId}:`, {
      count,
      distance: totalDistance.toFixed(2) + ' km',
      elevation: totalElevation + ' m'
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
}