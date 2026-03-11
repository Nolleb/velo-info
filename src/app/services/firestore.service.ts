import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from '@angular/fire/firestore';
import { GlobalStats, MonthStats, StoredActivity, ActivityMapData } from '../models/strava.model';

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

  // Données de map (collection séparée)
  async saveActivityMap(mapData: ActivityMapData): Promise<void> {
    const mapRef = doc(this.firestore, `users/${this.userId}/activity_maps/${mapData.activityId}`);
    await setDoc(mapRef, mapData);
  }

  async getActivityMap(activityId: number): Promise<ActivityMapData | null> {
    const mapRef = doc(this.firestore, `users/${this.userId}/activity_maps/${activityId}`);
    const snapshot = await getDoc(mapRef);
    return snapshot.exists() ? snapshot.data() as ActivityMapData : null;
  }

  // Stats globales
  async getGlobalStats(): Promise<GlobalStats | null> {
    const statsRef = doc(this.firestore, `users/${this.userId}/stats/global`);
    const snapshot = await getDoc(statsRef);
    return snapshot.exists() ? snapshot.data() as GlobalStats : null;
  }

  async updateGlobalStats(stats: Partial<GlobalStats>): Promise<void> {
    const statsRef = doc(this.firestore, `users/${this.userId}/stats/global`);
    const current = await this.getGlobalStats();
    
    const updated: GlobalStats = {
      totalDistance: (current?.totalDistance || 0) + (stats.totalDistance || 0),
      totalElevation: (current?.totalElevation || 0) + (stats.totalElevation || 0),
      totalTime: (current?.totalTime || 0) + (stats.totalTime || 0),
      activityCount: (current?.activityCount || 0) + (stats.activityCount || 0),
      lastActivityDate: stats.lastActivityDate || current?.lastActivityDate || null,
      lastSyncDate: new Date().toISOString(),
      userId: this.userId
    };

    await setDoc(statsRef, updated);
  }

  async setGlobalStats(stats: GlobalStats): Promise<void> {
    const statsRef = doc(this.firestore, `users/${this.userId}/stats/global`);
    await setDoc(statsRef, stats);
  }

  // Stats mensuelles
  async getMonthStats(year: number, month: number): Promise<MonthStats | null> {
    const monthId = `${year}-${month.toString().padStart(2, '0')}`;
    const monthRef = doc(this.firestore, `users/${this.userId}/months/${monthId}`);
    const snapshot = await getDoc(monthRef);
    return snapshot.exists() ? snapshot.data() as MonthStats : null;
  }

  async updateMonthStats(year: number, month: number, activity: StoredActivity): Promise<void> {
    const monthId = `${year}-${month.toString().padStart(2, '0')}`;
    const monthRef = doc(this.firestore, `users/${this.userId}/months/${monthId}`);
    const current = await this.getMonthStats(year, month);

    const distanceKm = activity.distance / 1000;
    const count = (current?.activityCount || 0) + 1;

    const updated: MonthStats = {
      year,
      month,
      totalDistance: (current?.totalDistance || 0) + distanceKm,
      totalElevation: (current?.totalElevation || 0) + activity.total_elevation_gain,
      totalTime: (current?.totalTime || 0) + activity.moving_time,
      activityCount: count,
      avgIntensity: ((current?.avgIntensity || 0) * (count - 1) + activity.metrics.intensity) / count,
      avgFatigue: ((current?.avgFatigue || 0) * (count - 1) + activity.metrics.fatigue) / count,
      userId: this.userId
    };

    await setDoc(monthRef, updated);
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