import { Injectable } from '@angular/core';
import { ActivityMetrics, SegmentEffort, StravaActivity } from '../models/strava.model';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  calculateMetrics(activity: StravaActivity): ActivityMetrics {

    const intensity = this.calculateRideIntensity(activity).profile;
    
    // Grand Fondo = 1 si la sortie fait plus de 100km, 0 sinon
    const grandFondo = (activity.distance / 1000) >= 100 ? 1 : 0;
 
    // Calcul de l'exploration basé sur les segments parcourus
    const segments = activity.segment_efforts || [];
    const exploration = this.calculateExplorationScore(segments);
    
    const regularity = 0;

    return {
      intensity,
      grandFondo,
      exploration,
      regularity
    };
  }

  calculateExplorationScore(segments: SegmentEffort[]): string {
    // Strava utilise des mètres pour la distance et des secondes pour elapsed_time
    // Filtrer les segments significatifs : distance > 500m ET elapsed_time > 60s
    const points = segments
      .filter(segment => segment.distance > 500 && segment.elapsed_time > 60)
      .map(s => {
        const count = s.achievements[0]?.effort_count || 0;

        console.info(`Segment ${s.name} - Athlete count: ${count}`);
        if (count === 1) return 10;
        if (count === 2) return 8;
        if (count === 3) return 6;
        if (count === 4) return 4;
        if (count === 5) return 2;

        return 0;
      });

    // Si aucun point, score = 0, sinon on fait la somme
    const score = points.length > 0 ? Math.min(100, points.reduce((a, b) => a + b, 0 as number)) : 0;

    return this.getExplorationProfile(score);
  }

  // Calculer le score brut d'exploration (utilisé pour la médiane mensuelle)
  calculateExplorationScoreRaw(segments: SegmentEffort[]): number {
    const points = segments
      .filter(segment => segment.distance > 500 && segment.elapsed_time > 60)
      .map(s => {
        const count = s.athlete_count || 0;

        if (count === 1) return 10;
        if (count === 2) return 8;
        if (count === 3) return 6;
        if (count === 4) return 4;
        if (count === 5) return 2;

        return 0;
      });

    return points.length > 0 ? Math.min(100, points.reduce((a, b) => a + b, 0 as number)) : 0;
  }

  calculateRideIntensity(activity: StravaActivity): {
    intensity: number;
    score: number;
    profile: string;
    } {

    const distance = activity.distance / 1000;
    const duration = activity.moving_time / 3600;
    const elevation = activity.total_elevation_gain;

    if (distance < 10 || duration < 0.75) {
      return {
        intensity: 0,
        score: 0,
        profile: 'Sortie trop courte'
      };
    }

    // Effort avec moins de poids sur le dénivelé (40 au lieu de 30)
    const effort = distance + (elevation / 40);

    const intensity = effort / duration;

    // Plage plus large pour éviter les scores trop élevés
    const minIntensity = 18;  // Plus bas pour couvrir les sorties très cool
    const maxIntensity = 35;  // Plus haut pour réserver 100% aux vrais compétiteurs

    const rawScore =
      ((intensity - minIntensity) /
        (maxIntensity - minIntensity)) * 100;

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    let profile = '';

    // Seuils ajustés
    if (score < 25) profile = 'Sortie cool';
    else if (score < 45) profile = 'Endurance';
    else if (score < 65) profile = 'Sportif';
    else if (score < 85) profile = 'Intense';
    else profile = 'Compétition';

    return {
      intensity: Math.round(intensity * 10) / 10,
      score,
      profile
    };
  }

  calculateMonthlyIntensityScore(activities: StravaActivity[]): number {

    const scores = activities
      .map(a => this.calculateRideIntensity(a).score)
      .filter(score => score > 0);

    if (!scores.length) return 0;

    scores.sort((a, b) => a - b);

    const middle = Math.floor(scores.length / 2);

    if (scores.length % 2 === 0) {
      return Math.round((scores[middle - 1] + scores[middle]) / 2);
    }

    return scores[middle];
  }

  // Calculer le score médian d'exploration pour un mois
  calculateMonthlyExplorationScore(activities: StravaActivity[]): number {
    const scores = activities
      .map(a => this.calculateExplorationScoreRaw(a.segment_efforts || []))
      .filter(score => score >= 0); // On garde même les 0

    if (!scores.length) return 0;

    scores.sort((a, b) => a - b);

    const middle = Math.floor(scores.length / 2);

    if (scores.length % 2 === 0) {
      return Math.round((scores[middle - 1] + scores[middle]) / 2);
    }

    return scores[middle];
  }

  calculateMonthlyRegularity(activities: StravaActivity[]): number {

    const validActivities = activities.filter(a => (a.distance / 1000) >= 10);

    if (!validActivities.length) return 0;

    // --- GROUP BY WEEK ---
    const weeks = new Map<string, StravaActivity[]>();

    validActivities.forEach(a => {
      const date = new Date(a.start_date);
      const year = date.getFullYear();
      const week = this.getWeekNumber(date);

      const key = `${year}-${week}`;

      if (!weeks.has(key)) {
        weeks.set(key, []);
      }

      weeks.get(key)!.push(a);
    });

    const totalWeeks = weeks.size;

    // --- WEEKLY KM ---
    const weeklyKm: number[] = [];

    weeks.forEach(weekActivities => {
      const km = weekActivities.reduce(
        (sum, a) => sum + (a.distance / 1000),
        0
      );

      weeklyKm.push(km);
    });

    // 1️⃣ Presence score (max 45) - Plus strict : besoin de 4.5 semaines pour le max
    const presenceScore = Math.min(45, (totalWeeks / 4.5) * 45);

    // 2️⃣ Distance consistency (objectif 120 km/semaine au lieu de 100)
    const targetKmPerWeek = 120;  // Plus exigeant
    const weeklyRatios = weeklyKm.map(km => Math.min(1, km / targetKmPerWeek));

    const distanceConsistency =
      weeklyRatios.reduce((a, b) => a + b, 0) / weeklyRatios.length;

    const distanceScore = distanceConsistency * 35;  // Réduit de 40 à 35

    // 3️⃣ Bonus fréquence - Plus difficile à obtenir
    const totalActivities = validActivities.length;
    const avgRidesPerWeek = totalActivities / totalWeeks;

    let frequencyBonus = 0;

    if (avgRidesPerWeek >= 4) frequencyBonus = 8;  // 4 sorties/semaine = 8 points
    else if (avgRidesPerWeek >= 3) frequencyBonus = 5;
    else if (avgRidesPerWeek >= 2) frequencyBonus = 2;  // Réduit de 3 à 2

    // 4️⃣ Longest streak
    const sortedWeeks = Array.from(weeks.keys()).sort();

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedWeeks.length; i++) {

      const [y1, w1] = sortedWeeks[i - 1].split('-').map(Number);
      const [y2, w2] = sortedWeeks[i].split('-').map(Number);

      if (w2 === w1 + 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    let streakBonus = 0;

    // Streak bonus plus difficile et graduel
    if (longestStreak >= 8) streakBonus = 12;       // 8 semaines = 12 points
    else if (longestStreak >= 6) streakBonus = 8;   // 6 semaines = 8 points  
    else if (longestStreak >= 4) streakBonus = 4;   // 4 semaines = 4 points

    const score =
      presenceScore +
      distanceScore +
      frequencyBonus +
      streakBonus;

    return Math.min(100, Math.round(score));
  }
  
  calculateYearlyRegularity(monthlyScores: number[]): number {
    return monthlyScores.reduce((sum, score) => sum + score, 0);
  }

  // Convertir un score d'intensité en profil (aligné avec calculateRideIntensity)
  getIntensityProfile(score: number): string {
    if (score < 25) return 'Sortie cool';
    if (score < 45) return 'Endurance';
    if (score < 65) return 'Sportif';
    if (score < 85) return 'Intense';
    return 'Compétition';
  }

  // Convertir un score d'exploration en profil
  getExplorationProfile(score: number): string {
    if (score === 0) return 'Routine';
    if (score < 20) return 'Parcours familier';
    if (score < 40) return 'Petite exploration';
    if (score < 80) return 'Explorateur';
    return 'Aventurier';
  }

  getWeekNumber(date: Date): number {
  
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
  
    tempDate.setDate(
      tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7)
    );
  
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
  
    return (
      1 +
      Math.round(
        ((tempDate.getTime() - week1.getTime()) / 86400000
          - 3 +
          ((week1.getDay() + 6) % 7)) / 7
      )
    );
  }
}
