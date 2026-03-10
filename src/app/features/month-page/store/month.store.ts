import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState
} from '@ngrx/signals';
import {inject} from '@angular/core';
import {withDevtools} from '@angular-architects/ngrx-toolkit';
import { InitialMonthSlice } from './month.slice';
import { ActivitiesService } from '../../../services/activities.service';
import { calculateYearTotals } from '../../../shared/utils/stats.utils';

// Create the SignalStore
export const MonthStore = signalStore(
  {providedIn: 'root'},

  // Add state
  withState(InitialMonthSlice),

  withProps(() => ({
    _activitiesService: inject(ActivitiesService),
  })),

  withProps((store) => ({
    _yearActivities: store._activitiesService.getCurrentYearDataResource(store.selectedYear ?? store.currentYear),
  })),

  // Add computed values (like selectors)
  withComputed(({_yearActivities}) => ({
    yearActivities: () => _yearActivities.hasValue() ? _yearActivities.value() : [],
    yearActivitiesLoading: () => _yearActivities.isLoading(),
    currentYearTotals: () => {
      const months = _yearActivities.hasValue() ? _yearActivities.value() : null;
      return months ? calculateYearTotals(months) : null;
    }
  })),

  withMethods((store) => ({
    setYearDate(year: number) {
      patchState(store, {selectedYear: year});
    },
    reloadActivities() {
      store._yearActivities.reload();
    }
  })),


  withDevtools('MonthStore')
);
