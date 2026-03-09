import { inject, Injectable, Signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { doc, DocumentReference, Firestore, docData, collection, query, where, orderBy, collectionData } from "@angular/fire/firestore";
import { getStarredSegments, LastActivity, MonthStats, StoredActivity, WeekActivity } from "../models/strava.model";
import { map, of } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  private firestore = inject(Firestore);
  private userId = 'dev-user';

  public getMonthsDataResource(year: Signal<number>, month: Signal<number>) {
    return rxResource<MonthStats | null, string>({
      params: () => {
        const monthId = `${year()}-${month().toString().padStart(2, '0')}`;
        return monthId;
      },
      stream: ({params}) => {
        if (!params) {
          return of(null);
        }

        const monthDoc = doc(this.firestore, `users/${this.userId}/months/${params}`) as DocumentReference<MonthStats>;
        return docData<MonthStats>(monthDoc).pipe(
          map(data => data ?? null),
        );
      } 
    })
  }

  public getGlobalDataResource() {
    return rxResource<MonthStats | null, string>({
      stream: () => {
      
        const monthDoc = doc(this.firestore, `users/${this.userId}/stats/global`) as DocumentReference<MonthStats>;
        return docData<MonthStats>(monthDoc).pipe(
          map(data => data ?? null),
        );
      } 
    })
  }

  public getCurrentYearDataResource(year: Signal<number | null>) {
    return rxResource<MonthStats[], number>({
      params: () => year()!,
      stream: ({params}) => {
        if (!params) {
          return of([]);
        }

        const monthsRef = collection(this.firestore, `users/${this.userId}/months`);
        
        return collectionData(monthsRef).pipe(
          map(data => {
            const months = data as MonthStats[];
            // Filtrer par année côté client
            return months
              .filter(m => m.year === params)
              .sort((a, b) => a.month - b.month);
          })
        );
      } 
    }) 
  }

  public getAllYears() {
    return rxResource<number[], void>({
      stream: () => {
        const monthsRef = collection(this.firestore, `users/${this.userId}/months`);
        return collectionData(monthsRef).pipe(
          map(data => {
            const months = data as MonthStats[];
            const years = new Set<number>();
            months.forEach(m => years.add(m.year));
            return Array.from(years).sort((a, b) => b - a);
          })
        );
      }
    });
  }

  public getMonthActivitiesResource(year: Signal<number |null>, month: Signal<number | null>) {
    return rxResource<WeekActivity[], string>({
      params: () => {
        if(!year() || !month()) {
          return '';
        }
        const monthId = `${year()}-${month()?.toString().padStart(2, '0')}`;
        return monthId;
      },
      stream: ({params}) => {
        if (!params) {
          return of([]);
        }

        const activitiesRef = collection(this.firestore, `users/${this.userId}/activities`);
        const q = query(
          activitiesRef,
          where('month', '==', params)
        );
        
        return collectionData(q).pipe(
          map(data => {
            return data.map(item => (
              { 
                id: item['id'], 
                start_date: item['start_date'], 
                name: item['name'],
                distance: item['distance'],
                moving_time: item['moving_time'],
                total_elevation_gain: item['total_elevation_gain']
              })) as WeekActivity[];
          })
        );
      }
    });
  }

  public getActivityResource(activityId: Signal<number | null>) {
    return rxResource<StoredActivity | null, number>({
      params: () => activityId()!,
      stream: ({params}) => {
        if (!params) {
          return of(null);
        }
        const activityDoc = doc(this.firestore, `users/${this.userId}/activities/${params}`) as DocumentReference<StoredActivity>;
        return docData(activityDoc).pipe(
          map(data => {
            if (!data) return null;
           
            data.distance = data.distance / 1000;
            return data;
          }),  
        );
      }
    });
  }

  public getLatestActivityResource() {
    return rxResource<LastActivity | null, void>({
      stream: () => {
        const activitiesRef = collection(this.firestore, `users/${this.userId}/activities`);
        const q = query(
          activitiesRef,
          orderBy('start_date', 'desc')
        );
        
        return collectionData(q).pipe(
          map(data => {
            if (data.length === 0) return null;
            const act = ({
              id: data[0]['id'],
              name: data[0]['name'],
              distance: data[0]['distance'],
              start_date: data[0]['start_date'],
              moving_time: data[0]['moving_time'],
              device_name: data[0]['device_name'],
              total_elevation_gain: data[0]['total_elevation_gain'],
              polyline: data[0]['map']?.polyline || ''
            }) as LastActivity;

            act.distance = act.distance / 1000;
            return act;
          })
        );
      }
    });
  }

}
