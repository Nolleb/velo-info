import { MonthStats } from "../../models/strava.model";
import * as turf from '@turf/turf';
import departements from '../data/geojson/departements.json';

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

export function getMainRideZone(coords: number[] | [number, number][]) {
  if (!coords?.length) return null;

  const stats: Record<string, number> = {};
  const sampled = coords.filter((_, i) => i % 30 === 0) as [number, number][];
  sampled.forEach(([lat, lng]) => {

    const point = turf.point([lng, lat]);

    for (const dep of departements.features) {

      if (turf.booleanPointInPolygon(point, dep as any)) {

        const name = dep.properties.nom;

        stats[name] = (stats[name] || 0) + 1;

        break;
      }
    }

  });
  const sorted = Object.entries(stats)
    .sort((a, b) => b[1] - a[1]);

  return sorted.length ? sorted[0][0] : null;
}

export function getRideZones(coords: number[] | [number, number][]) {
  if (!coords?.length) return null;

  const sampled = coords.filter((_, i) => i % 30 === 0) as [number, number][];
  const departments = new Set();

  sampled.forEach(([lat, lng]) => {

    const point = turf.point([lng, lat]);

    departements.features.forEach((dep: any) => {
      if (turf.booleanPointInPolygon(point, dep as any)) {
        departments.add(dep.properties.nom);
      }
    });

  });

  return [...departments];
}

