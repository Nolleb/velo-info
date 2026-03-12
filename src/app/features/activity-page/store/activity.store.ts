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
import { decode } from '@googlemaps/polyline-codec';

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

  withComputed(({_activity}) => ({
    routes: (): [number, number][] | null => {
      const activity = _activity.hasValue() ? _activity.value() : null;
      const polyline = activity?.map?.summary_polyline;
      if (!polyline) return null;
      
      // Décoder le polyline encodé
      return decode(polyline) as [number, number][];
    },
    starredSegments: () => {
      const activity = _activity.hasValue() ? _activity.value() : null;
      return activity ? activity.segment_efforts : [];
    }
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
