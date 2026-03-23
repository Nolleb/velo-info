import { Injectable } from '@angular/core';
import { StravaActivity, StravaMap } from '../models/strava.model';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class StravaService {
  private baseUrl = 'https://www.strava.com/api/v3';
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Strava rate limit: 200 requests per 15-minute window
  private readonly RATE_LIMIT = 190; // 190 to keep a safety margin
  private readonly WINDOW_MS = 15 * 60 * 1000;
  private requestTimestamps: number[] = [];

  private async throttle(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < this.WINDOW_MS);

    if (this.requestTimestamps.length >= this.RATE_LIMIT) {
      const waitMs = this.WINDOW_MS - (now - this.requestTimestamps[0]) + 500;
      console.warn(`⏳ Strava rate limit approaching (${this.requestTimestamps.length}/${this.RATE_LIMIT}), waiting ${Math.ceil(waitMs / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      const afterWait = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter(t => afterWait - t < this.WINDOW_MS);
    }

    this.requestTimestamps.push(Date.now());
  }

  private async fetchApi(url: string, token: string, retries = 3): Promise<Response> {
    await this.throttle();
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 429) {
      if (retries === 0) throw new Error(`Strava API rate limit exceeded (429): ${url}`);
      // Reset tracking and wait for the current 15-min window to pass
      this.requestTimestamps = [];
      const waitMs = this.WINDOW_MS + 5000;
      console.error(`⛔ 429 Too Many Requests — waiting ${Math.ceil(waitMs / 1000 / 60)} min before retrying...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return this.fetchApi(url, token, retries - 1);
    }

    return response;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: environment.strava.clientId,
        client_secret: environment.strava.clientSecret,
        refresh_token: environment.strava.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) throw new Error('Failed to refresh Strava token');
    const data = await response.json();
    this.accessToken = data.access_token;

    if(!this.accessToken) {
      throw new Error('No access token received from Strava');
    }

    this.tokenExpiry = data.expires_at * 1000;
    return this.accessToken;
  }

  async getActivities(page: number = 1, perPage: number = 200, after?: number, before?: number): Promise<StravaActivity[]> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (after) {
      params.append('after', after.toString());
    }

    if (before) {
      params.append('before', before.toString());
    }

    const response = await this.fetchApi(`${this.baseUrl}/athlete/activities?${params}`, token);

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    return response.json();
  }

  async getActivityDetail(id: number): Promise<StravaActivity> {
    const token = await this.getAccessToken();
    const response = await this.fetchApi(`${this.baseUrl}/activities/${id}?include_all_efforts=true`, token);

    if (!response.ok) {
      throw new Error('Failed to fetch activity detail');
    }

    return response.json();
  }

  async getActivityMap(id: number): Promise<StravaMap[]> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      keys: 'latlng,altitude,distance'
    });
    const response = await this.fetchApi(`${this.baseUrl}/activities/${id}/streams?${params}`, token);

    if (!response.ok) {
      throw new Error('Failed to fetch activity map');
    }

    return response.json();
  }

  // NOTE: L'endpoint /segments/{id}/all_efforts nécessite un abonnement Strava premium (erreur 402)
  // Les meilleurs temps sont maintenant calculés localement via FirestoreService.getTopSegmentEfforts()
  /*
  async getSegmentEfforts(segmentId: number): Promise<SegmentEffort[]> {
    const token = await this.getAccessToken();
    
    const response = await fetch(
      `${this.baseUrl}/segments/${segmentId}/all_efforts`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch segment efforts: ${response.status}`);
    }

    const efforts = await response.json();
    
    // Trier par temps (moving_time) et prendre les 3 meilleurs
    return efforts
      .sort((a: SegmentEffort, b: SegmentEffort) => a.moving_time - b.moving_time)
      .slice(0, 3);
  }
  */
}