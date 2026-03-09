import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'speed' })
export class SpeedPipe implements PipeTransform {

    transform(value: number): number {
        return Number((value * 3.6).toFixed(2));
    }
}
