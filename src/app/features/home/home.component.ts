import { Component, computed, inject, Signal } from "@angular/core";
import { Router } from "@angular/router";
import { getRoutePath } from "../../app.routes";
import { MONTHS, MONTHS_SLUGS } from "../../shared/utils/variables/months";
import { GlobalResultComponent } from "../../shared/components/global-result/global-result.component";
import { ResultCriterion } from "../../models/result-criterion.model";
import { HomeStore } from "./store/home.store";
import { JsonPipe } from "@angular/common";
import { minutesToTimeString } from "../../shared/utils/time.utils";
import { WeekStore } from "../week-page/store/week.store";
import { SafeDatePipe } from "../../shared/pipes/safe-date.pipe";
import { CycleLoaderComponent } from "../../shared/components/cycle-loader/cycle-loader.component";
import { ActivityMapComponent } from "../../shared/components/activity-map/activity-map.component";
import { MonthResultComponent } from "../../shared/components/month-result/month-result.component";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  imports: [GlobalResultComponent, JsonPipe, SafeDatePipe, CycleLoaderComponent, ActivityMapComponent, MonthResultComponent]
})
export class HomeComponent {

  readonly router = inject(Router);
  readonly homeStore = inject(HomeStore);
  readonly weekStore = inject(WeekStore);
  today = new Date();

  months = MONTHS
  currentYear = this.today.getFullYear().toString();
  currentMonth = this.today.getMonth();

  getRoutePath = getRoutePath

  lastActivity: Signal<ResultCriterion[]> = computed(() => [
    {
      label: 'Distance',
      value: this.homeStore.latestActivity()?.distance.toFixed(2).toString() + ' kms',
      icon: {
        name: 'distance',
        width: '100%',
        height: '25px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Dénivelé',
      value: this.homeStore.latestActivity()?.total_elevation_gain.toFixed(2).toString() + ' m',
      icon: {
        name: 'elevation',
        width: '100%',
        height: '22px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Temps',
      value: minutesToTimeString(this.homeStore.latestActivity()?.moving_time || 0),
      icon: {
        name: 'chrono',
        width: '100%',
        height: '30px',
        color: 'var(--grey-semi-light-color)',
      },
    },
  ]);

  statsGlobales: Signal<ResultCriterion[]> = computed(() => [
    {
      label: 'Distance',
      value: this.homeStore.globalActivities()?.totalDistance.toFixed(2).toString() + ' kms',
      icon: {
        name: 'distance',
        width: '100%',
        height: '25px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Dénivelé',
      value: this.homeStore.globalActivities()?.totalElevation.toFixed(2).toString() + ' m',
      icon: {
        name: 'elevation',
        width: '100%',
        height: '22px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Temps',
      value: minutesToTimeString(this.homeStore.globalActivities()?.totalTime || 0),
      icon: {
        name: 'chrono',
        width: '100%',
        height: '30px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Activités',
      value: this.homeStore.globalActivities()?.activityCount || 0,
      icon: {
        name: 'cycling',
        width: '100%',
        height: '30px',
        color: 'var(--grey-semi-light-color)',
      },
    }
  ]);
  
  statsCurrentYear: Signal<ResultCriterion[]> = computed(() => [
    {
      label: 'Distance',
      value: this.homeStore.currentYearTotals()?.totalDistance.toFixed(2).toString() + ' kms',
      icon: {
        name: 'distance',
        width: '100%',
        height: '25px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Dénivelé',
      value: this.homeStore.currentYearTotals()?.totalElevation.toFixed(2).toString() + ' m',
      icon: {
        name: 'elevation',
        width: '100%',
        height: '22px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Temps',
      value: minutesToTimeString(this.homeStore.currentYearTotals()?.totalTime || 0),
      icon: {
        name: 'chrono',
        width: '100%',
        height: '30px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Activités',
      value: this.homeStore.currentYearTotals()?.activityCount || 0,
      icon: {
        name: 'cycling',
        width: '100%',
        height: '30px',
        color: 'var(--grey-semi-light-color)',
      },
    }
  ]);

  onOpenWeekPage(monthIndex: number, year: string) {
    const monthSlug = MONTHS_SLUGS[monthIndex];

    this.weekStore.setMonthDate(monthIndex);
    this.weekStore.setYearDate(parseInt(year));
    this.router.navigate([this.getRoutePath('weekPage').replace(':year', this.currentYear).replace(':month', monthSlug.toLowerCase())]);
  }

  onOpenMonthPage() {
    this.router.navigate([this.getRoutePath('monthPage').replace(':year', this.currentYear)]);
  }

  onOpenActivityPage(id: number | undefined) {
    this.router.navigate([this.getRoutePath('activity').replace(':id', id?.toString() || '')]);
  }
}