import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jsonParse'
})
export class JsonParsePipe implements PipeTransform {

  transform(value: any): any {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

}
