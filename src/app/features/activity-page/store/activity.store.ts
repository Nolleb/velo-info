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
import { InitialActivitySlice } from './activity.slice';
import { ActivitiesService } from '../../../services/activities.service';

// Create the SignalStore
export const ActivityStore = signalStore(
  {providedIn: 'root'},

  // Add state
  withState(InitialActivitySlice),

  withProps(() => ({
    _activitiesService: inject(ActivitiesService),
  })),

  withProps((store) => ({
    _activity: store._activitiesService.getActivityResource(store.activityID),
  })),

  // Add computed values (like selectors)
  withComputed(({_activity}) => ({
    activity: () => _activity.hasValue() ? _activity.value() : null,
    activityLoading: () => _activity.isLoading(),
  })),

  withMethods((store) => ({
    setActivityID(activityID: number) {
      patchState(store, {activityID: activityID});
    },
    reloadActivity() {
      store._activity.reload();
    }
  })),


  withDevtools('ActivityStore')
);
