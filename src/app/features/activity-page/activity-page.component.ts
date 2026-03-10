import { Component, computed, inject, input, OnInit, Signal } from "@angular/core";
import { ActivityStore } from "./store/activity.store";
import { JsonPipe } from "@angular/common";
import { SafeDatePipe } from "../../shared/pipes/safe-date.pipe";
import { GlobalResultComponent } from "../../shared/components/global-result/global-result.component";
import { minutesToTimeString } from "../../shared/utils/time.utils";
import { ResultCriterion, ResultCriterionBlock } from "../../models/result-criterion.model";
import { SpeedPipe } from "../../shared/pipes/convertSpeed";
import { MinutesToTimePipe } from "../../shared/pipes/minutes-to-time.pipe";
import { ActivityMapComponent } from "../../shared/components/activity-map/activity-map.component";

@Component({
  selector: "app-activity-page",
  templateUrl: "./activity-page.component.html",
  styleUrls: ["./activity-page.component.scss"],
  imports: [JsonPipe, SafeDatePipe, GlobalResultComponent, SpeedPipe, MinutesToTimePipe, ActivityMapComponent]
})

export class ActivityPageComponent implements OnInit {
  activityStore = inject(ActivityStore);
  id = input<string>();

  mainActivity: Signal<ResultCriterionBlock> = computed(() => ({
    rows: [
      // Ligne 1 : Distance, Dénivelé, Temps
      [
        {
          label: 'Distance',
          value: (this.activityStore.activity()?.distance.toFixed(2).toString() + ' kms'),
          icon: {
            name: 'distance',
            width: '100%',
            height: '20px',
            color: 'var(--grey-semi-light-color)',
          },
        },
        {
          label: 'Dénivelé',
          value: (this.activityStore.activity()?.total_elevation_gain.toFixed(2).toString() + ' m'),
          icon: {
            name: 'elevation',
            width: '20px',
            height: '100%',
            color: 'var(--grey-semi-light-color)',
          },
        },
        {
          label: 'Temps',
          value: minutesToTimeString(this.activityStore.activity()?.moving_time || 0),
          icon: {
            name: 'chrono',
            width: '20px',
            height: '100%',
            color: 'var(--grey-semi-light-color)',
          },
        },
      ],
      [
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
      [
        {
          label: 'Puissance estimée',
          value: this.activityStore.activity()?.average_watts ? this.activityStore.activity()?.average_watts + ' W' : 'N/A',
          icon: {
            name: 'power',
            width: '20px',
            height: '20px',
            color: 'var(--grey-semi-light-color)',
          },
        },
        {
          label: 'Energie dépensée',
          value: this.activityStore.activity()?.kilojoules ? this.activityStore.activity()?.kilojoules + ' kJ' : 'N/A',
          icon: {
            name: 'calorie',
            width: '20px',
            height: '20px',
            color: 'var(--grey-semi-light-color)',
          },
        }
      ]
    ]
  }));

  ngOnInit(): void {
    const activityID = this.id() ? parseInt(this.id()!) : null;
    if (activityID) {
      this.activityStore.setActivityID(activityID);
    }
  }
}