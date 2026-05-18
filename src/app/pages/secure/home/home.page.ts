import { Component, OnInit, ViewChild } from '@angular/core';
import { SwiperComponent } from 'swiper/angular';
import SwiperCore, { SwiperOptions, Pagination } from 'swiper';
SwiperCore.use([Pagination]);
import { DataService } from '../../../services/helper/data.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild('swiper') swiper_categories: SwiperComponent;
  @ViewChild('swiper') swiper_deals: SwiperComponent;
  @ViewChild('swiper') swiper_restaurants: SwiperComponent;

  categories: any[] = [];
  products: any[] = [];
  settings: any;
  user: any;
  uploadUrl = environment.uploadUrl;

  // Swiper config
  swiper_categories_config: SwiperOptions = {
    slidesPerView: 3.4,
    spaceBetween: 16
  };
  swiper_categories_deals: SwiperOptions = {
    slidesPerView: 1.2,
    spaceBetween: 16,
    pagination: { clickable: false },
    allowTouchMove: true
  };
  swiper_categories_restaurants: SwiperOptions = {
    slidesPerView: 1.2,
    spaceBetween: 16,
    pagination: { clickable: false },
    allowTouchMove: true
  };

  constructor(private dataService: DataService) { }

  async ngOnInit() {
    try {
      this.categories = await this.dataService.getCategories() || [];
      this.products = await this.dataService.getProducts() || [];
      this.settings = await this.dataService.getSettings();
      this.user = await this.dataService.getProfile();
    } catch (e) {
      console.log('Veri yüklenirken hata:', e);
      this.categories = this.categories || [];
      this.products = this.products || [];
    }
  }

  getCategoryIcon(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('düğün')) return '💍';
    if (n.includes('cenaze')) return '🕯️';
    if (n.includes('doğum') || n.includes('gün')) return '🎂';
    if (n.includes('iftar') || n.includes('ramazan')) return '🌙';
    if (n.includes('toplantı') || n.includes('kurumsal')) return '💼';
    return '🍴';
  }

  getCategoryColor(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('düğün')) return '#fdf2f2'; // Soft Red
    if (n.includes('cenaze')) return '#f8f9fa'; // Soft Gray
    if (n.includes('doğum') || n.includes('gün')) return '#fff9db'; // Soft Yellow
    if (n.includes('iftar') || n.includes('ramazan')) return '#ebfbee'; // Soft Green
    if (n.includes('toplantı') || n.includes('kurumsal')) return '#e7f5ff'; // Soft Blue
    return '#f4f4f4';
  }

}
