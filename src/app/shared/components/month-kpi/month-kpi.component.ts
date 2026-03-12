import { Component, computed, input, Signal } from "@angular/core";
import { MonthStats } from "../../../models/strava.model";
import { SvgIconDirective } from "../../ui/svg/svg-icon.directive";
import { minutesToTimeString } from "../../utils/time.utils";
import { ResultCriterion } from "../../../models/result-criterion.model";

@Component({
  selector: "app-month-kpi",
  templateUrl: "./month-kpi.component.html",
  styleUrls: ["./month-kpi.component.scss"],
  imports: [SvgIconDirective]
})
export class MonthKpiComponent {
  results = input<MonthStats | null>();
  isPrimary = input<boolean>(false);

  resultsRowToDisplay: Signal<ResultCriterion[]> = computed(() => {
    if (!this.results()) return [];
    return [
      {
        label: 'Distance',
        value: (this.results()?.totalDistance.toFixed(2).toString() + ' kms'),
        icon: {
          name: 'distance',
          width: '100%',
          height: '25px',
          color: 'var(--grey-semi-light-color)',
        },
      },
      {
        label: 'Dénivelé',
        value: (this.results()?.totalElevation.toFixed(2).toString() + ' m'),
        icon: {
          name: 'elevation',
          width: '100%',
          height: '22px',
          color: 'var(--grey-semi-light-color)',
        },
      },
      {
        label: 'Temps',
        value: minutesToTimeString(this.results()?.totalTime || 0),
        icon: {
          name: 'chrono',
          width: '100%',
          height: '30px',
          color: 'var(--grey-semi-light-color)',
        },
      },
    
      {
        label: 'Activités',
        value: this.results()?.activityCount || 0,
        icon: {
          name: 'cycling',
          width: '100%',
          height: '30px',
          color: 'var(--grey-semi-light-color)',
        },
      }           
    ]
  })

  resultsColumnToDisplay: Signal<ResultCriterion[]> = computed(() => {
    if (!this.results()) return [];
    return [
      {
        label: 'Intensité',
        value: '67%',
        icon: {
          name: 'energy',
          width: '100%',
          height: '30px',
          color: 'var(--grey-semi-light-color)',
        },
      },
      {
        label: 'Fatigue',
        value: '90%',
        icon: {
          name: 'fatigue',
          width: '100%',
          height: '25px',
          color: 'var(--grey-semi-light-color)',
        },
      },
    
      {
        label: 'Régularité',
        value: '93%',
        icon: {
          name: 'regularity',
          width: '100%',
          height: '30px',
          color: 'var(--grey-semi-light-color)',
        },
      },
      {
        label: 'Exploration',
        value: '23%',
        icon: {
          name: 'earth',
          width: '30px',
          height: '30px',
          color: 'var(--grey-semi-light-color)',
        },
      },           
    ]
  })

  finalResultsToDisplay = computed(() => {
    if (this.isPrimary()) {
      return this.resultsRowToDisplay();
    } else {
      return this.resultsColumnToDisplay();
    }
  })

}