import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../services/helper/data.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit {

  orders: any[] = [];
  content_loaded: boolean = false;

  constructor(private dataService: DataService) { }

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    try {
      this.orders = await this.dataService.getMyOrders() || [];
      this.content_loaded = true;
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
      this.orders = [];
    }
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'Hazırlanıyor': return 'primary';
      case 'Yolda': return 'warning';
      case 'Teslim Edildi': return 'success';
      case 'İptal Edildi': return 'danger';
      default: return 'medium';
    }
  }

}
