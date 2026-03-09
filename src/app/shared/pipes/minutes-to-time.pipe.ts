import { Pipe, PipeTransform } from '@angular/core';
import { minutesToTimeString } from '../utils/time.utils';

@Pipe({
  name: 'minutesToTime',
  standalone: true
})
export class MinutesToTimePipe implements PipeTransform {
  transform(totalMinutes: number): string {
    return minutesToTimeString(totalMinutes);
  }
}
