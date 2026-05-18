import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private api: ApiService) { }

  // Categories
  async getCategories() {
    const res: any = await firstValueFrom(this.api.get('categories'));
    return res?.categories;
  }

  // Site Settings
  async getSettings() {
    const res: any = await firstValueFrom(this.api.get('settings'));
    return res?.settings;
  }

  // Products
  async getProducts(categoryId?: number) {
    const params = categoryId ? { category_id: categoryId } : {};
    const res: any = await firstValueFrom(this.api.get('products', params));
    return res?.products;
  }

  // Category Fields (for order form)
  async getCategoryFields(categoryId: number) {
    const res: any = await firstValueFrom(this.api.get('category_fields/' + categoryId));
    return res?.fields;
  }

  // Addresses
  async getAddresses() {
    const res: any = await firstValueFrom(this.api.get('get_addresses'));
    return res?.addresses;
  }

  async addAddress(addressData: any) {
    const res: any = await firstValueFrom(this.api.post('add_address', addressData));
    return res;
  }

  async deleteAddress(addressId: number) {
    const res: any = await firstValueFrom(this.api.get('delete_address/' + addressId));
    return res;
  }

  // Cities & Districts
  async getCities() {
    const res: any = await firstValueFrom(this.api.get('cities'));
    return res?.cities;
  }

  async getDistricts(cityId: number) {
    const res: any = await firstValueFrom(this.api.get('districts/' + cityId));
    return res?.districts;
  }

  // Orders
  async getMyOrders() {
    const res: any = await firstValueFrom(this.api.get('my_orders'));
    return res?.orders;
  }

  async getOrderDetail(orderId: number) {
    const res: any = await firstValueFrom(this.api.get('order_detail/' + orderId));
    return res?.detail;
  }

  async createOrder(orderData: any) {
    const res: any = await firstValueFrom(this.api.post('create_order', orderData));
    return res;
  }
  // Profile
  async getProfile() {
    const res: any = await firstValueFrom(this.api.get('profile'));
    return res?.user;
  }

  async updateProfile(profileData: any) {
    const res: any = await firstValueFrom(this.api.post('profile', profileData));
    return res;
  }
}
