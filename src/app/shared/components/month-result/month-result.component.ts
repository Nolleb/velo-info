import { Component, computed, input } from "@angular/core";
import { MonthStats } from "../../../models/strava.model";
import { ProgressChartComponent } from "../progress-chart/progress-chart.component";
import { MonthKpiComponent } from "../month-kpi/month-kpi.component";

@Component({
  selector: "app-month-result",
  templateUrl: "./month-result.component.html",
  styleUrls: ["./month-result.component.scss"],
  imports: [ProgressChartComponent, MonthKpiComponent]
})

export class MonthResultComponent {
  results = input<MonthStats | null>();

  currentMonth = computed(() => this.results()?.month)
  currentDistanceValue = computed(() => this.results()?.totalDistance)
  currentElevationValue = computed(() => this.results()?.totalElevation)

  currentDistanceObjective = computed(() => this.monthObjectives[this.currentMonth()! - 1][0].kms)
  currentElevationObjective = computed(() => this.monthObjectives[this.currentMonth()! - 1][0].elevation)

  currentMonthName = computed(() => this.monthObjectives[this.currentMonth()! - 1][0].name)

  monthObjectives = [
    [
      {
        kms: 400,
        name: 'Janvier',
        elevation: 3000,
      },
    ],
    [
      {
        kms: 400,
        name: 'Février',
        elevation: 3000,
      },
    ],
    [
      {
        kms: 600,
        name: 'Mars',
        elevation: 5000,
      },
    ],
    [
      {
        kms: 600,
        name: 'Avril',
        elevation: 5000,
      },
    ],
    [
      {
        kms: 600,
        name: 'Mai',
        elevation: 5000,
      },
    ],
    [
      {
        kms: 600,
        name: 'Juin',
        elevation: 6000,
      },
    ],
    [
      {
        kms: 800,
        name: 'Juillet',
        elevation: 8000,
      },
    ],
    [
      {
        kms: 800,
        name: 'Août',
        elevation: 8000,
      },
    ],
    [
      {
        kms: 800,
        name: 'Septembre',
        elevation: 8000,
      },
    ],
    [
      {
        kms: 600,
        name: 'Octobre',
        elevation: 5000,
      },
    ],
    [
      {
        kms: 400,
        name: 'Novembre',
        elevation: 4000,
      },
    ],
    [
      {
        kms: 300,
        name: 'Décembre',
        elevation: 3000,
      },
    ]
  ]
}