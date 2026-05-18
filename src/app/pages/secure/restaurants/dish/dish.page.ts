import { Component, OnInit, ViewChild } from '@angular/core';
import { SwiperComponent } from 'swiper/angular';
import SwiperCore, { SwiperOptions, Pagination } from 'swiper';
import { ToastService } from 'src/app/services/toast/toast.service';
SwiperCore.use([Pagination]);

@Component({
  selector: 'app-dish',
  templateUrl: './dish.page.html',
  styleUrls: ['./dish.page.scss'],
})
export class DishPage implements OnInit {

  added_to_cart: boolean = false;
  is_favorite: boolean = false;
  content_loaded: boolean = false;

  @ViewChild('swiper') swiper_ingredients: SwiperComponent;

  // Swiper config
  swiper_ingredients_config: SwiperOptions = {
    slidesPerView: 3.4,
    spaceBetween: 16
  };

  constructor(
    private toastService: ToastService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    // Fake timeout since we do not load any data
    setTimeout(() => {
      this.content_loaded = true;
    }, 500);
  }

  ionViewWillLeave() {
    this.content_loaded = false;
  }

  toggleFavorite() {
    this.toastService.presentToast('Supreme Burger', 'added to favorites', 'top', 'success', 2000);
    this.is_favorite = this.is_favorite ? false : true;
  }

  addToCart() {
    this.toastService.presentToast('Supreme Burger', 'added to cart', 'top', 'success', 2000);
    this.added_to_cart = true;
  }

}
