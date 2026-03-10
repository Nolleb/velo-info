import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'km' })
export class KmPipe implements PipeTransform {

    transform(value: number): number {
        return Number((value / 1000).toFixed(2));
    }
}
