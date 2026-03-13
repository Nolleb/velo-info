import { MonthStats } from "../../models/strava.model";
import * as turf from '@turf/turf';

// Lazy loading du fichier GeoJSON
let departementsCache: any = null;
async function getDepartements() {
  if (!departementsCache) {
    departementsCache = await import('../data/geojson/departements.json');
  }
  return departementsCache.default;
}

export interface YearTotals {
  totalDistance: number;
  totalElevation: number;
  totalTime: number;
  activityCount: number;
  grandFondo: number;
  yearlyRegularity: number;
}

export function calculateYearTotals(months: MonthStats[]): YearTotals {
  if (!months || months.length === 0) {
    return {
      totalDistance: 0,
      totalElevation: 0,
      totalTime: 0,
      activityCount: 0,
      grandFondo: 0,
      yearlyRegularity: 0
    };
  }

  const totals = months.reduce((acc, month) => ({
    totalDistance: acc.totalDistance + month.totalDistance,
    totalElevation: acc.totalElevation + month.totalElevation,
    totalTime: acc.totalTime + month.totalTime,
    activityCount: acc.activityCount + month.activityCount,
    grandFondo: acc.grandFondo + month.grandFondo,
    yearlyRegularity: acc.yearlyRegularity + (month.regularity || 0)
  }), {
    totalDistance: 0,
    totalElevation: 0,
    totalTime: 0,
    activityCount: 0,
    grandFondo: 0,
    yearlyRegularity: 0
  });

  return {
    totalDistance: totals.totalDistance,
    totalElevation: totals.totalElevation,
    totalTime: totals.totalTime,
    activityCount: totals.activityCount,
    grandFondo: totals.grandFondo,
    yearlyRegularity: totals.yearlyRegularity
  };
}

export async function getMainRideZone(coords: number[] | [number, number][]) {
  if (!coords?.length) return null;

  const departements = await getDepartements();
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

export async function getRideZones(coords: number[] | [number, number][]) {
  if (!coords?.length) return null;

  const departements = await getDepartements();
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

