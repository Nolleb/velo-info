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
    _activityMap: store._activitiesService.getActivityMapResource(store.activityID),
  })),

  // Add computed values (like selectors)
  withComputed(({_activity, _activityMap}) => ({
    activity: () => _activity.hasValue() ? _activity.value() : null,
    activityLoading: () => _activity.isLoading(),
    activityMap: () => _activityMap.hasValue() ? _activityMap.value() : null,
    activityMapLoading: () => _activityMap.isLoading(),
  })),

  withComputed(({_activityMap, _activity}) => ({
    routes: (): [number, number][] | null => _activityMap.hasValue() ? _activityMap.value()?.latlng.map(p => [p.lat, p.lng] as [number, number]) ?? null : null,
    altitudes: (): number[] | null => _activityMap.hasValue() ? _activityMap.value()?.altitude ?? null : null,
    distances: (): number[] | null => _activityMap.hasValue() ? _activityMap.value()?.distance ?? null : null, 
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
      store._activityMap.reload();
    }
  })),

  withDevtools('ActivityStore')
);
