import {
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState
} from '@ngrx/signals';
import {inject} from '@angular/core';
import {withDevtools} from '@angular-architects/ngrx-toolkit';
import { InitialHomeSlice } from './home.slice';
import { ActivitiesService } from '../../../services/activities.service';
import { calculateYearTotals } from '../../../shared/utils/stats.utils';

// Create the SignalStore
export const HomeStore = signalStore(
  {providedIn: 'root'},

  // Add state
  withState(InitialHomeSlice),

  withProps(() => ({
    _activitiesService: inject(ActivitiesService),
  })),

  withProps((store) => ({
    _currentMonthActivities: store._activitiesService.getMonthsDataResource(store.currentYear, store.currentMonth),
    _globalActivities: store._activitiesService.getGlobalDataResource(),
    _currentYearActivities: store._activitiesService.getCurrentYearDataResource(store.currentYear),
    _lastActivity: store._activitiesService.getLatestActivityResource(),
  })),

  // Add computed values (like selectors)
  withComputed(({_currentMonthActivities, _globalActivities, _currentYearActivities, _lastActivity}) => ({
    currentMonthActivitiesLoading: () => _currentMonthActivities.isLoading(),
    currentMonthActivities: () => _currentMonthActivities.hasValue() ? _currentMonthActivities.value() : null,
    errorCurrentMonthActivities: () => _currentMonthActivities.error(),
    globalActivitiesLoading: () => _globalActivities.isLoading(),
    globalActivities: () => _globalActivities.hasValue() ? _globalActivities.value() : null,
    globalActivitiesError: () => _globalActivities.error(),
    currentYearActivitiesLoading: () => _currentYearActivities.isLoading(),
    currentYearActivities: () => _currentYearActivities.hasValue() ? _currentYearActivities.value() : null,
    errorCurrentYearActivities: () => _currentYearActivities.error(),
    // Totaux cumulés de l'année
    currentYearTotals: () => {
      const months = _currentYearActivities.hasValue() ? _currentYearActivities.value() : null;
      return months ? calculateYearTotals(months) : null;
    },
    latestActivity: () => _lastActivity.hasValue() ? _lastActivity.value() : null,
    latestActivityLoading: () => _lastActivity.isLoading()
  })),

  withDevtools('HomeStore')
);
