export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  elev_high?: number;
  elev_low?: number;
  device_name?: string;
  sport_type: string;
  average_watts?: number;
  kilojoules?: number;
  max_watts?: number;
  average_cadence?: number;
  calories?: number;
  map?: {
    id?: string;
    polyline?: string;
    summary_polyline?: string;
  };
  segment_efforts?: SegmentEffort[];
}

export interface SegmentEffort {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  start_date: string;
  start_date_local: string;
  average_heartrate?: number;
  max_heartrate?: number;
  segment: {
    id: number;
    name: string;
    activity_type: string;
    distance: number;
    average_grade: number;
    maximum_grade: number;
    elevation_high: number;
    elevation_low: number;
    climb_category: number;
    starred?: boolean;
  };
  pr_rank?: number;
  achievements?: Array<{
    type_id: number;
    type: string;
    rank: number;
  }>;
}

export interface LastActivity {
  id: number;
  name: string;
  distance: number;
  start_date: string;
  moving_time: number;
  device_name: string;
  total_elevation_gain: number;
  polyline: string;
}

export interface WeekActivity {
  id: number;
  start_date: string;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
}

export interface ActivityMetrics {
  intensity: number;
  fatigue: number;
  exploration: number;
  regularity: number;
}

export interface StoredActivity extends StravaActivity {
  metrics: ActivityMetrics;
  userId: string;
  month: string; // Format: 'YYYY-MM'
  year: number;
}

// Helper pour filtrer les segments favoris
export function getStarredSegments(activity: StoredActivity): SegmentEffort[] {
  return activity.segment_efforts?.filter(effort => effort.segment.starred) || [];
}

export interface MonthStats {
  year: number;
  month: number;
  totalDistance: number;
  totalElevation: number;
  totalTime: number;
  activityCount: number;
  avgIntensity: number;
  avgFatigue: number;
  userId: string;
}

export interface GlobalStats {
  totalDistance: number;
  totalElevation: number;
  totalTime: number;
  activityCount: number;
  lastActivityDate: string | null;
  lastSyncDate: string;
  userId: string;
}