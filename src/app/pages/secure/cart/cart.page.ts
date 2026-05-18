import { Component, OnInit } from '@angular/core';
import { CartService } from '../../../services/helper/cart.service';
import { DataService } from '../../../services/helper/data.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {

  buy_clicked: boolean = false;
  order_placed: boolean = false;
  content_loaded: boolean = false;
  
  cartItems: any[] = [];
  total: number = 0;
  orderCode: string = '';
  addresses: any[] = [];

  constructor(
    private cartService: CartService,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
    });
  }

  async ionViewWillEnter() {
    this.addresses = await this.dataService.getAddresses();
    this.content_loaded = true;
  }

  ionViewWillLeave() {
    this.content_loaded = false;
  }

  async buy() {
    if (this.cartItems.length === 0) return;
    
    // Şimdilik varsa ilk adresi seçiyoruz. Gerçek uygulamada kullanıcıya seçtirilir.
    if (this.addresses.length === 0) {
      alert('Lütfen önce profilinizden bir adres ekleyiniz.');
      return;
    }

    this.buy_clicked = true;

    const orderData = {
      kategori_id: this.cartItems[0].categoryId, // Şimdilik ilk ürünün kategorisi
      address_id: this.addresses[0].id,
      urunler: this.cartItems.map(item => ({ id: item.id, miktar: item.miktar })),
      form_data: {} // Ek alanlar şimdilik boş
    };

    try {
      const response = await this.dataService.createOrder(orderData);
      if (response.status) {
        this.orderCode = response.order_code;
        this.order_placed = true;
        this.cartService.clearCart();
      } else {
        alert('Sipariş hatası: ' + response.message);
      }
    } catch (error) {
      console.error(error);
      alert('Sipariş sırasında teknik bir hata oluştu.');
    } finally {
      this.buy_clicked = false;
    }
  }

}
