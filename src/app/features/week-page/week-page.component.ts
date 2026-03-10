import { JsonPipe, DatePipe } from "@angular/common";
import { Component, computed, inject, input, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { MONTHS, MONTHS_SLUGS } from "../../shared/utils/variables/months";
import { StoredActivity, WeekActivity } from "../../models/strava.model";
import { WeekStore } from "./store/week.store";
import { getRoutePath } from "../../app.routes";
import { CycleLoaderComponent } from "../../shared/components/cycle-loader/cycle-loader.component";

@Component({
  selector: "app-week-page",
  templateUrl: "./week-page.component.html",
  styleUrls: ["./week-page.component.scss"],
  imports: [JsonPipe, DatePipe, CycleLoaderComponent]
})
export class WeekPageComponent implements OnInit {

  readonly weekStore = inject(WeekStore);
  private router = inject(Router);
  
  year = input<string>();
  month = input<string>();

  months = MONTHS;
  modalActivities = signal<WeekActivity[]>([]);
  showModal = signal(false);

  getRoutePath = getRoutePath

  ngOnInit(): void {
    const yearFromRoute = this.year() ? parseInt(this.year()!) : new Date().getFullYear();
    const monthFromRoute = this.monthIndex();
    
    this.weekStore.setYearDate(yearFromRoute);
    this.weekStore.setMonthDate(monthFromRoute + 1);
  }

  monthIndex = computed(() => {
    const monthSlug = this.month();
    if (!monthSlug) return -1;
    return this.monthToIndex(monthSlug);
  });

  calendar = computed(() => {
    const yearValue = this.year();
    const monthSlug = this.month();

    if (!yearValue || !monthSlug) return [];

    const year = Number(yearValue);
    const month = this.monthToIndex(monthSlug);

    const start = this.getStartOfCalendar(year, month);
    const end = this.getEndOfCalendar(year, month);

    const weeks: Date[][] = [];
    const current = new Date(start);

    while (current <= end) {
      const week: Date[] = [];

      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      weeks.push(week);
    }

    return weeks;
  });

  activitiesByDate = computed(() => {
    const activities = this.weekStore.monthActivities();
    const map = new Map<string, WeekActivity[]>();

    activities.forEach(activity => {
      const date = new Date(activity.start_date);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const existing = map.get(key) || [];
      map.set(key, [...existing, activity]);
    });

    return map;
  });

  getDayActivities(day: Date): WeekActivity[] {
    const key = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`;
    return this.activitiesByDate().get(key) || [];
  }

  getActivitiesCount(day: Date): number {
    return this.getDayActivities(day).length;
  }

  onDayClick(day: Date): void {
    const activities = this.getDayActivities(day);
    
    if (activities.length === 0) {
      return;
    }
    
    if (activities.length === 1) {
      // Naviguer vers le détail de l'activité
      this.router.navigate([getRoutePath('activity').replace(':id', activities[0].id.toString())]);
    } else {
      // Afficher la modal
      this.modalActivities.set(activities);
      this.showModal.set(true);
    }
  }

  onActivitySelect(activityId: number): void {
    this.showModal.set(false);
    this.router.navigate([getRoutePath('activity').replace(':id', activityId.toString())]);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalActivities.set([]);
  }

  private getStartOfCalendar(year: number, month: number): Date {
    const date = new Date(year, month, 1);
    const day = date.getDay() || 7; // dimanche => 7
    date.setDate(date.getDate() - (day - 1));
    return date;
  }

  private getEndOfCalendar(year: number, month: number): Date {
    const date = new Date(year, month + 1, 0);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() + (7 - day));
    return date;
  }

  private monthToIndex(month: string): number {
    return MONTHS_SLUGS.indexOf(month.toLowerCase());
  }
}