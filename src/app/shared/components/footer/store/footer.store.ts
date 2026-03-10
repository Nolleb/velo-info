import {
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState
} from '@ngrx/signals';
import {inject} from '@angular/core';
import {withDevtools} from '@angular-architects/ngrx-toolkit';
import { InitialFooterSlice } from './footer.slice';
import { ActivitiesService } from '../../../../services/activities.service';

// Create the SignalStore
export const FooterStore = signalStore(
  {providedIn: 'root'},

  // Add state
  withState(InitialFooterSlice),

  withProps(() => ({
    _activitiesService: inject(ActivitiesService),
  })),

  withProps((store) => ({
    _getAllYears: store._activitiesService.getAllYears(),
  })),

  // Add computed values (like selectors)
  withComputed(({_getAllYears}) => ({
    getAllYears: () => _getAllYears.hasValue() ? _getAllYears.value() : [],
    getAllYearsLoading: () => _getAllYears.isLoading(),
  })),


  withDevtools('FooterStore')
);
