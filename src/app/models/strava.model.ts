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

export interface StravaMap {
  type: 'latlng' | 'distance' | 'altitude';
  data: number[] | [number, number][];
} 
 
export interface SegmentEffort {
  device_watts: boolean
  athlete: Athlete
  segment: Segment
  id: number
  moving_time: number
  visibility: string
  resource_state: number
  name: string
  end_index: number
  start_date_local: string
  elapsed_time: number
  pr_rank: any
  start_index: number
  hidden: boolean
  activity: Activity
  achievements: any[]
  start_date: string
  distance: number,
  overallRanking?: {
    gold: number | null;
    silver: number | null;
    bronze: number | null;
  }
}

export interface Activity {
  id: number
  visibility: string
  resource_state: number
}

export interface Athlete {
  resource_state: number
  id: number
}

export interface Segment {
  activity_type: string
  elevation_profiles: any
  id: number
  elevation_high: number
  maximum_grade: number
  city?: string
  resource_state: number
  private: boolean
  end_latlng: number[]
  climb_category: number
  name: string
  start_latlng: number[]
  state?: string
  hazardous: boolean
  elevation_low: number
  average_grade: number
  starred: boolean
  country?: string
  elevation_profile: any
  distance: number
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
  main_area: string;
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
  main_ride_zone: string,
  list_ride_zone:string[],
  metrics: ActivityMetrics;
  userId: string;
  month: string; // Format: 'YYYY-MM'
  year: number;
}

// Interface pour les données de map (stockées séparément)
export interface ActivityMapData {
  activityId: number;
  latlng: { lat: number; lng: number }[];
  altitude: number[];
  distance: number[];
  userId: string;
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