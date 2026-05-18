import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../../../services/helper/data.service';

import { CartService } from '../../../../services/helper/cart.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  categoryId: any;
  products: any[] = [];
  fields: any[] = [];
  cartCount: number = 0;
  uploadUrl = environment.uploadUrl;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private cartService: CartService
  ) { }

  async ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.products = await this.dataService.getProducts(this.categoryId);
      this.fields = await this.dataService.getCategoryFields(this.categoryId);
    }
    this.cartService.cartItems$.subscribe(items => {
      this.cartCount = items.length;
    });
  }

  addToCart(product: any) {
    this.cartService.addToCart(product, this.categoryId);
  }

}
