import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterActive'
})
export class FilterActivePipe implements PipeTransform {
  transform(fields: any[], formData: any): any[] {
    if (!fields || !formData) return [];
    return fields.filter(f => formData[f.name]);
  }
}
