import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DishPageRoutingModule } from './dish-routing.module';

import { DishPage } from './dish.page';

// Swiper
import { SwiperModule } from 'swiper/angular';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DishPageRoutingModule,
    SwiperModule
  ],
  declarations: [DishPage]
})
export class DishPageModule {}
