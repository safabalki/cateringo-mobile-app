import { Component, OnInit } from '@angular/core';
import { SwiperOptions } from 'swiper';
import { DataService } from 'src/app/services/helper/data.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  categories: any[] = [];
  products: any[] = [];
  featuredMenus: any[] = [];
  settings: any;
  user: any;
  defaultAddress: any;
  uploadUrl = environment.uploadUrl;
  slides: any[] = [];
  campaignsList: any[] = [];

  // Category navigation drawer modal states
  isSubCategoryModalOpen = false;
  selectedCategory: any = null;

  // Swiper configuration for campaigns banner
  swiper_campaigns: SwiperOptions = {
    slidesPerView: 1.1,
    spaceBetween: 12,
    centeredSlides: true,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false
    }
  };

  // Swiper configuration for horizontal categories
  swiper_categories: SwiperOptions = {
    slidesPerView: 4.2,
    spaceBetween: 10,
    freeMode: true
  };

  // Swiper configuration for dynamic campaign products list
  swiper_campaign_list: SwiperOptions = {
    slidesPerView: 1.3,
    spaceBetween: 14,
    freeMode: true
  };

  constructor(private dataService: DataService, private router: Router) { }

  getFallbackSlides() {
    return [
      {
        slaytId: 'mock1',
        slaytBaslik: 'Toplu İftar Menüleri',
        slaytAltBaslik: 'Ramazan ayına özel indirimli paketler',
        bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        isMock: true,
        icon: '🌙'
      },
      {
        slaytId: 'mock2',
        slaytBaslik: 'Düğün & Nişan Yemekleri',
        slaytAltBaslik: 'Hayalinizdeki güne özel profesyonel catering',
        bgGradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        isMock: true,
        icon: '💍'
      },
      {
        slaytId: 'mock3',
        slaytBaslik: 'Kurumsal Toplantı & Coffe Break',
        slaytAltBaslik: 'Şirket organizasyonlarına özel menüler',
        bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        isMock: true,
        icon: '💼'
      }
    ];
  }

  async ngOnInit() {
    try {
      this.categories = await this.dataService.getCategories() || [];
      
      // Load featured menus (packages) dynamically
      try {
        this.featuredMenus = await this.dataService.getFeaturedMenus() || [];
      } catch (fErr) {
        console.log('Önerilen menüler yüklenemedi:', fErr);
        this.featuredMenus = [];
      }

      const allProducts = await this.dataService.getProducts() || [];
      this.products = allProducts.filter((p: any) => p.populer == 1 || p.populer == '1');
      this.settings = await this.dataService.getSettings();
      this.user = await this.dataService.getProfile();

      // Load slides dynamically
      try {
        const apiSlides = await this.dataService.getSlides();
        if (apiSlides && apiSlides.length > 0) {
          this.slides = apiSlides;
        } else {
          this.slides = this.getFallbackSlides();
        }
      } catch (slideErr) {
        console.log('Slaytlar yüklenemedi, fallback kullanılıyor:', slideErr);
        this.slides = this.getFallbackSlides();
      }

      // Load campaigns dynamically
      try {
        this.campaignsList = await this.dataService.getCampaigns() || [];
      } catch (campErr) {
        console.log('Kampanyalar yüklenemedi:', campErr);
        this.campaignsList = [];
      }

      try {
        const addresses = await this.dataService.getAddresses() || [];
        if (addresses.length > 0) {
          const foundDefault = addresses.find((a: any) => a.varsayilan == 1 || a.varsayilan == '1');
          this.defaultAddress = foundDefault ? foundDefault : addresses[0];
        }
      } catch (addrErr) {
        console.log('Adresler yüklenemedi:', addrErr);
      }
    } catch (e) {
      console.log('Veri yüklenirken hata:', e);
      this.categories = this.categories || [];
      this.products = this.products || [];
    }
  }

  selectCategory(category: any) {
    if (category.children && category.children.length > 0) {
      this.selectedCategory = category;
      this.isSubCategoryModalOpen = true;
    } else {
      this.router.navigate(['/secure/order-wizard', category.id]);
    }
  }

  closeSubCategoryModal() {
    this.isSubCategoryModalOpen = false;
  }

  selectSubCategory(subCategory: any) {
    this.isSubCategoryModalOpen = false;
    setTimeout(() => {
      this.router.navigate(['/secure/order-wizard', subCategory.id]);
    }, 150);
  }

  selectFeaturedMenu(menu: any) {
    // Önerilen menüye tıklandığında sipariş sihirbazına, menünün catering_kategori_id'si 
    // ve queryParams olarak menu_id gönderilerek yönlendirme yapılır.
    this.router.navigate(['/secure/order-wizard', menu.catering_kategori_id], {
      queryParams: { menu_id: menu.id }
    });
  }
}
