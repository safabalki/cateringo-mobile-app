import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cityName'
})
export class CityNamePipe implements PipeTransform {
  transform(cityId: any, cities: any[]): string {
    if (!cityId || !cities) return '';
    const city = cities.find(c => c.id == cityId);
    return city ? city.il_adi : cityId;
  }
}

@Pipe({
  name: 'districtName'
})
export class DistrictNamePipe implements PipeTransform {
  transform(districtId: any, districts: any[]): string {
    if (!districtId || !districts) return '';
    const dist = districts.find(d => d.id == districtId);
    return dist ? dist.ilce_adi : districtId;
  }
}
