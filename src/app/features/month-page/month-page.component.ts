import { Component, computed, inject, input, OnInit, Signal } from "@angular/core";
import { MONTHS, MONTHS_SLUGS } from "../../shared/utils/variables/months";
import { Router } from "@angular/router";
import { getRoutePath } from "../../app.routes";
import { CardInfosComponent } from "../../shared/components/card-infos/card-infos.component";
import { MonthStore } from "./store/month.store";
import { GlobalResultComponent } from "../../shared/components/global-result/global-result.component";
import { ResultCriterion, ResultCriterionBlock } from "../../models/result-criterion.model";
import { minutesToTimeString } from "../../shared/utils/time.utils";
import { WeekStore } from "../week-page/store/week.store";
import { CycleLoaderComponent } from "../../shared/components/cycle-loader/cycle-loader.component";

@Component({
  selector: "app-month-page",
  templateUrl: "./month-page.component.html",
  styleUrls: ["./month-page.component.scss"],
  imports: [CardInfosComponent, GlobalResultComponent, CycleLoaderComponent]
})
export class MonthPageComponent implements OnInit {

  router = inject(Router);
  readonly monthStore = inject(MonthStore);
  readonly weekStore = inject(WeekStore);

  year = input<string>();

  today = new Date();

  currentYear = this.today.getFullYear().toString();
  currentMonth = this.today.getMonth();

  months = MONTHS

  getRoutePath = getRoutePath

  statsCurrentYear: Signal<ResultCriterion[]> = computed(() => [
    {
      label: 'Distance',
      value: this.monthStore.currentYearTotals()?.totalDistance.toFixed(2).toString() + ' kms',
      icon: {
        name: 'distance',
        width: '100%',
        height: '20px',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Dénivelé',
      value: this.monthStore.currentYearTotals()?.totalElevation.toFixed(2).toString() + ' m',
      icon: {
        name: 'elevation',
        width: '20px',
        height: '100%',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Temps',
      value: minutesToTimeString(this.monthStore.currentYearTotals()?.totalTime || 0),
      icon: {
        name: 'chrono',
        width: '20px',
        height: '100%',
        color: 'var(--grey-semi-light-color)',
      },
    },
    {
      label: 'Activités',
      value: this.monthStore.currentYearTotals()?.activityCount || 0,
      icon: {
        name: 'cycling',
        width: '100%',
        height: '20px',
        color: 'var(--grey-semi-light-color)',
      },
    }
  ]);

  availableMonths = computed(() => {
    if(!this.year()) {
      return [];
    }

    let months: number[] = [];

    const availableMonths = this.monthStore.yearActivities()?.map(m => m.month) || [];
    availableMonths.forEach((m, index, arr) => arr[index] = m - 1);

    if (this.year()! < this.currentYear) {
      months = Array.from({ length: 12 }, (_, i) => i);
    }

    if (this.year() === this.currentYear) {
      months = Array.from({ length: this.currentMonth + 1 }, (_, i) => i);
    }

    months = availableMonths.length > 0 ? months.filter(m => availableMonths.includes(m)) : months;

    return months.reverse();
  });

  getMonthStats(monthIndex: number): ResultCriterionBlock {
    const monthStats = this.monthStore.yearActivities().find(m => m.month === monthIndex + 1);
    
    if (!monthStats) {
      return { rows: [] };
    }

    return   {
      rows: [
        // Ligne 1 : Distance, Dénivelé, Temps
        [
          {
            label: 'Distance',
            value: (monthStats?.totalDistance.toFixed(2).toString() + ' kms'),
            icon: {
              name: 'distance',
              width: '100%',
              height: '20px',
              color: 'var(--grey-semi-light-color)',
            },
          },
          {
            label: 'Dénivelé',
            value: (monthStats?.totalElevation.toFixed(2).toString() + ' m'),
            icon: {
              name: 'elevation',
              width: '20px',
              height: '100%',
              color: 'var(--grey-semi-light-color)',
            },
          },
          {
            label: 'Temps',
            value: minutesToTimeString(monthStats?.totalTime || 0),
            icon: {
              name: 'chrono',
              width: '20px',
              height: '100%',
              color: 'var(--grey-semi-light-color)',
            },
          },
        ],
        // Ligne 2 : Activités, Intensité, Fatigue
        [
          {
            label: 'Activités',
            value: monthStats?.activityCount || 0,
            icon: {
              name: 'cycling',
              width: '24px',
              height: '20px',
              color: 'var(--grey-semi-light-color)',
            },
          },
          {
            label: 'Intensité',
            value: '67%',
            icon: {
              name: 'energy',
              width: '100%',
              height: '20px',
              color: 'var(--grey-semi-light-color)',
            },
          },
          {
            label: 'Fatigue',
            value: '90%',
            icon: {
              name: 'fatigue',
              width: '20px',
              height: '20px',
              color: 'var(--grey-semi-light-color)',
            },
          },
        ],
        // Ligne 3 : Régularité, Exploration
        [
          {
            label: 'Régularité',
            value: '93%',
            icon: {
              name: 'regularity',
              width: '100%',
              height: '20px',
              color: 'var(--grey-semi-light-color)',
            },
          },
          {
            label: 'Exploration',
            value: '23%',
            icon: {
              name: 'earth',
              width: '20px',
              height: '100%',
              color: 'var(--grey-semi-light-color)',
            },
          },
        ]
      ]
    }
    
  }

  ngOnInit(): void {
    const yearFromRoute = this.year() ? parseInt(this.year()!) : new Date().getFullYear();
    this.monthStore.setYearDate(yearFromRoute);
  }

  onOpenWeekPage(year: string, monthIndex: number) {

    if (!year || monthIndex === undefined) return;

    this.weekStore.setYearDate(parseInt(year));
    this.weekStore.setMonthDate(monthIndex);
    
    const monthSlug = MONTHS_SLUGS[monthIndex];
    if (!monthSlug) {
      this.router.navigate([
      this.getRoutePath('weekPage')
        .replace(':year', year)
        .replace(':month', 'janvier')
      ]);
    }

    this.router.navigate([
      this.getRoutePath('weekPage')
        .replace(':year', year)
        .replace(':month', monthSlug)
    ]);
  }
}