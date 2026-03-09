import {Routes} from '@angular/router';

export const routePaths = {
  home: '',
  syncActivities: 'sync',
  monthPage: 'mois/:year',
  weekPage: 'semaines/:year/:month',
  activity: 'activite/:id'
} as const;

export const getRoutePath = (route: keyof typeof routePaths): string => {
  return `/${routePaths[route]}`;
};

export const routes: Routes = [
  {
    path: routePaths.home,
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: routePaths.syncActivities,
    loadComponent: () => import('./features/sync-activities/sync-activities.component').then(m => m.SyncActivitiesComponent),
  },
  {
    path: routePaths.monthPage,
    loadComponent: () => import('./features/month-page/month-page.component').then(m => m.MonthPageComponent),
  },
  {
    path: routePaths.weekPage,
    loadComponent: () => import('./features/week-page/week-page.component').then(m => m.WeekPageComponent),
  },
  {
    path: routePaths.activity,
    loadComponent: () => import('./features/activity-page/activity-page.component').then(m => m.ActivityPageComponent),
  }
];

