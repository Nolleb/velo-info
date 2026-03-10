import { Injectable } from '@angular/core';
import { StravaActivity } from '../models/strava.model';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class StravaService {
  private baseUrl = 'https://www.strava.com/api/v3';
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

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

  async getActivities(page: number = 1, perPage: number = 200, after?: number): Promise<StravaActivity[]> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (after) {
      params.append('after', after.toString());
    }

    const response = await fetch(`${this.baseUrl}/athlete/activities?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    return response.json();
  }

  async getActivityDetail(id: number): Promise<StravaActivity> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/activities/${id}?include_all_efforts=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity detail');
    }

    return response.json();
  }
}