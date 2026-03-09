import { MonthStats } from "../../models/strava.model";

export interface YearTotals {
  totalDistance: number;
  totalElevation: number;
  totalTime: number;
  activityCount: number;
  avgIntensity: number;
  avgFatigue: number;
}

export function calculateYearTotals(months: MonthStats[]): YearTotals {
  if (!months || months.length === 0) {
    return {
      totalDistance: 0,
      totalElevation: 0,
      totalTime: 0,
      activityCount: 0,
      avgIntensity: 0,
      avgFatigue: 0
    };
  }

  const totals = months.reduce((acc, month) => ({
    totalDistance: acc.totalDistance + month.totalDistance,
    totalElevation: acc.totalElevation + month.totalElevation,
    totalTime: acc.totalTime + month.totalTime,
    activityCount: acc.activityCount + month.activityCount,
    // Somme pondérée pour les moyennes
    avgIntensitySum: acc.avgIntensitySum + (month.avgIntensity * month.activityCount),
    avgFatigueSum: acc.avgFatigueSum + (month.avgFatigue * month.activityCount)
  }), {
    totalDistance: 0,
    totalElevation: 0,
    totalTime: 0,
    activityCount: 0,
    avgIntensitySum: 0,
    avgFatigueSum: 0
  });

  return {
    totalDistance: totals.totalDistance,
    totalElevation: totals.totalElevation,
    totalTime: totals.totalTime,
    activityCount: totals.activityCount,
    // Calculer la vraie moyenne pour l'année
    avgIntensity: totals.activityCount > 0 ? totals.avgIntensitySum / totals.activityCount : 0,
    avgFatigue: totals.activityCount > 0 ? totals.avgFatigueSum / totals.activityCount : 0
  };
}
