import { Component, computed, input } from "@angular/core";
import { GlobalResultComponent } from "../global-result/global-result.component";
import { MonthStats } from "../../../models/strava.model";
import { JsonPipe } from "@angular/common";
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

  monthObjectives = [
    [
      {
        kms: 400,
        elevation: 3000,
      },
    ],
    [
      {
        kms: 400,
        elevation: 3000,
      },
    ],
    [
      {
        kms: 600,
        elevation: 5000,
      },
    ],
    [
      {
        kms: 600,
        elevation: 5000,
      },
    ],
    [
      {
        kms: 600,
        elevation: 5000,
      },
    ],
    [
      {
        kms: 600,
        elevation: 6000,
      },
    ],
    [
      {
        kms: 800,
        elevation: 8000,
      },
    ],
    [
      {
        kms: 800,
        elevation: 8000,
      },
    ],
    [
      {
        kms: 800,
        elevation: 8000,
      },
    ],
    [
      {
        kms: 800,
        elevation: 8000,
      },
    ],
    [
      {
        kms: 800,
        elevation: 8000,
      },
    ],
    [
      {
        kms: 600,
        elevation: 5000,
      },
    ],
    [
      {
        kms: 300,
        elevation: 300,
      },
    ],
    [
      {
        kms: 300,
        elevation: 200,
      },
    ],
    [
      {
        kms: 800,
        elevation: 8000,
      },
    ],
    [
      {
        kms: 800,
        elevation: 8000,
      },
    ],
    [
      {
        kms: 600,
        elevation: 5000,
      },
    ],
    [
      {
        kms: 300,
        elevation: 300,
      },
    ],
    [
      {
        kms: 300,
        elevation: 200,
      },
    ]
  ]
}