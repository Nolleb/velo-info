import { Injectable } from '@angular/core';
import { ActivityMetrics, StravaActivity } from '../models/strava.model';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  calculateMetrics(activity: StravaActivity): ActivityMetrics {
    const distanceKm = activity.distance / 1000;
    const durationHours = activity.moving_time / 3600;
    const elevationM = activity.total_elevation_gain;

    // Intensité = distance + (dénivelé / 100)
    // Seulement pour les activités significatives (>= 15min et >= 5km)
    let intensity = 0;
    if (durationHours >= 0.25 && distanceKm >= 5) {
      intensity = distanceKm + (elevationM / 100);
    }

    // Fatigue = intensité × √(durée)
    const fatigue = intensity * Math.sqrt(durationHours);

    // Exploration et Régularité à implémenter plus tard
    const exploration = 0;
    const regularity = 0;

    return {
      intensity,
      fatigue,
      exploration,
      regularity
    };
  }

  calculateMonthlyRegularity(activities: StravaActivity[]): number {
    const validActivities = activities.filter(a => (a.distance / 1000) >= 10);

    const totalKm = validActivities.reduce((sum, a) => sum + (a.distance / 1000), 0);
    const totalActivities = validActivities.length;

    // 1️⃣ Base (max 60)
    const baseScore = Math.min(60, (totalKm / 400) * 60);

    // 2️⃣ Bonus régularité
    const weeklyBonus = totalActivities >= 12 ? 5 : 0;

    // 3️⃣ Bonus longue sortie
    let longRideBonus = 0;

    const hasUltra = validActivities.some(a =>
      (a.distance / 1000) > 200 || a.total_elevation_gain > 2000
    );

    const hasLong = validActivities.some(a =>
      (a.distance / 1000) > 100 || a.total_elevation_gain > 1000
    );

    if (hasUltra) {
      longRideBonus = 10;
    } else if (hasLong) {
      longRideBonus = 5;
    }

    // 4️⃣ Bonus dépassement km (plafonné à 40)
    const bonusKm = totalKm > 400
      ? Math.min(40, (totalKm - 400) * 0.1)
      : 0;

    const monthlyScore = baseScore + weeklyBonus + longRideBonus + bonusKm;

    return Math.round(monthlyScore);
  }
  
  calculateYearlyRegularity(monthlyScores: number[]): number {
    return monthlyScores.reduce((sum, score) => sum + score, 0);
  }
}