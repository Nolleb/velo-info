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
import { InitialWeekSlice } from './week.slice';
import { ActivitiesService } from '../../../services/activities.service';

// Create the SignalStore
export const WeekStore = signalStore(
  {providedIn: 'root'},

  // Add state
  withState(InitialWeekSlice),

  withProps(() => ({
    _activitiesService: inject(ActivitiesService),
  })),

  withProps((store) => ({
    _monthActivities: store._activitiesService.getMonthActivitiesResource(store.selectedYear, store.selectedMonth),
  })),

  // Add computed values (like selectors)
  withComputed(({_monthActivities}) => ({
    monthActivities: () => _monthActivities.hasValue() ? _monthActivities.value() : [],
    monthActivitiesLoading: () => _monthActivities.isLoading(),
  })),

  withMethods((store) => ({
    setYearDate(year: number) {
      patchState(store, {selectedYear: year});
    },
    setMonthDate(month: number) {
      patchState(store, {selectedMonth: month});
    },
    reloadActivities() {
      store._monthActivities.reload();
    }
  })),


  withDevtools('WeekStore')
);
