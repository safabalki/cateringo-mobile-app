import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems = new BehaviorSubject<any[]>([]);
  cartItems$ = this.cartItems.asObservable();

  constructor() { }

  addToCart(product: any, categoryId: number) {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.miktar += 1;
      this.cartItems.next([...currentItems]);
    } else {
      this.cartItems.next([...currentItems, { 
        id: product.id, 
        urun_adi: product.urun_adi, 
        fiyat: product.fiyat, 
        resim: product.resim,
        miktar: 1,
        categoryId: categoryId 
      }]);
    }
  }

  getCart() {
    return this.cartItems.value;
  }

  getTotal() {
    return this.cartItems.value.reduce((total, item) => total + (item.fiyat * item.miktar), 0);
  }

  clearCart() {
    this.cartItems.next([]);
  }

  removeItem(productId: number) {
    const currentItems = this.cartItems.value;
    const updatedItems = currentItems.filter(item => item.id !== productId);
    this.cartItems.next(updatedItems);
  }
}
