import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../services/helper/data.service';
import { LoadingController, ToastController, ModalController, ActionSheetController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-order-wizard',
  templateUrl: './order-wizard.page.html',
  styleUrls: ['./order-wizard.page.scss'],
})
export class OrderWizardPage implements OnInit {

  getOptionPrice(field: any, val: any): number {
    if (!field.secenekler || !val) return 0;
    try {
      // API'den gelen secenekler string veya array olabilir
      const opts = typeof field.secenekler === 'string' ? JSON.parse(field.secenekler) : field.secenekler;
      const matched = opts.find((o: any) => (o.label || o).toString() === val.toString());
      return Number(matched?.price || 0);
    } catch {
      return 0;
    }
  }

  getFieldPrice(field: any, val: any, currentTotal: number = 0): number {
    if (!val || val === 'false' || val === false) return 0;
    
    let price = Number(field.fiyat_degeri || 0);
    if (field.tip === 'select' || field.tip === 'radio') {
      const optPrice = this.getOptionPrice(field, val);
      if (optPrice > 0) price = optPrice;
    }

    const numVal = Number(val);
    const effect = field.fiyat_etkisi;
    const subEffect = field.carpan_turu || 'kendi_icinde';

    if (effect === 'multiplier') {
      if (subEffect === 'kendi_icinde') {
        return !isNaN(numVal) ? (price * numVal) : price;
      } else {
        const factor = !isNaN(numVal) ? numVal : price;
        return currentTotal * (factor - 1);
      }
    } else if (effect === 'fixed') {
      return price;
    }
    return 0;
  }

  totalBeforeFields(index: number): number {
    let subtotal = 0;
    this.selectedProducts.forEach(p => {
      subtotal += Number(p.fiyat) * Number(p.quantity);
    });
    
    // Aktif (seçili) alanları bul - Şablondaki filterActive borusu (pipe) ile aynı mantıkta olmalı
    const activeFields = this.categoryFields.filter(f => {
      const v = this.formData[f.name];
      return !!v && v !== 'false' && v !== false;
    });

    for (let j = 0; j < index; j++) {
       const field = activeFields[j];
       subtotal += this.getFieldPrice(field, this.formData[field.name], subtotal);
    }
    return subtotal;
  }

  currentStep: number = 1;
  categoryId: any;
  category: any;
  uploadUrl = environment.uploadUrl;

  // Yeni Hiyerarşik ve Dinamik Menü Değişkenleri
  groupedProducts: any[] = [];
  activeGroupIndex: number = 0;
  recommendedMenus: any[] = [];
  selectedMenuId: any = null;

  // Step 1: Teslimat
  cities: any[] = [];
  districts: any[] = [];
  addresses: any[] = [];
  deliveryData = {
    selected_address_id: '',
    city_id: '',
    district_id: '',
    address_text: ''
  };
  isCityModalOpen: boolean = false;
  isDistrictModalOpen: boolean = false;
  filteredCities: any[] = [];
  filteredDistricts: any[] = [];

  // Step 2: Menü
  products: any[] = [];
  categoryFields: any[] = [];
  selectedProducts: any[] = []; // { id, miktar, urun_adi, fiyat }
  formData: any = {}; // Dinamik alan verileri

  // Step 3: Bilgiler
  userData: any = {
    ad_soyad: '',
    email: '',
    telefon: ''
  };

  // Step 4: Ödeme
  paymentMethod: string = 'havale';
  siteSettings: any;

  // Summary
  totalPrice: number = 0;
  deliveryFee: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private modalController: ModalController,
    private actionSheetController: ActionSheetController,
    private sanitizer: DomSanitizer
  ) { }

  getSafeBankaBilgileri(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.siteSettings?.banka_bilgileri || '');
  }

  getSafeVideoUrl(): any {
    if (!this.category?.video_url) return null;
    try {
      let url = this.category.video_url;
      if (url.includes('youtube.com/watch?v=')) {
        url = url.replace('watch?v=', 'embed/');
      } else if (url.includes('youtu.be/')) {
        url = url.replace('youtu.be/', 'youtube.com/embed/');
      }
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } catch {
      return null;
    }
  }

  async ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    await this.loadInitialData();
  }

  async loadInitialData() {
    const loading = await this.loadingController.create({
      message: 'Veriler yükleniyor...'
    });
    await loading.present();

    try {
      // Paralel yükleme
      const [citiesArr, profileData, settingsData] = await Promise.all([
        this.dataService.getCities(),
        this.dataService.getProfile(),
        this.dataService.getSettings()
      ]);

      this.cities = citiesArr || [];
      this.filteredCities = [...this.cities];
      this.siteSettings = settingsData;
      
      if (profileData) {
        let loadedPhone = profileData.telefon || '';
        if (loadedPhone) {
          const cleanVal = loadedPhone.replace(/\D/g, '');
          if (cleanVal.length > 0) {
            let val = cleanVal;
            if (!val.startsWith('0')) {
              val = '0' + val;
            }
            let formatted = val.substring(0, 4);
            if (val.length > 4) formatted += ' ' + val.substring(4, 7);
            if (val.length > 7) formatted += ' ' + val.substring(7, 9);
            if (val.length > 9) formatted += ' ' + val.substring(9, 11);
            loadedPhone = formatted;
          }
        }
        
        this.userData = {
          ad_soyad: profileData.ad_soyad || '',
          email: profileData.email || '',
          telefon: loadedPhone
        };
      }

      // Adresleri çekelim
      this.addresses = await this.dataService.getAddresses() || [];

      // Kategori alanları ve gruplanmış ürünleri çekelim
      const categoryData = await this.dataService.getCategoryFields(this.categoryId);
      if (categoryData && categoryData.status) {
        this.category = categoryData.kategori;
        this.groupedProducts = categoryData.grouped_products || [];
        
        // Ürün havuzunu tekil listede toplayalım (sipariş hesaplama ve kaydetme mantığı bozulmasın diye)
        this.products = [];
        this.groupedProducts.forEach((group: any) => {
          if (group.urunler) {
            group.urunler.forEach((p: any) => {
              p.quantity = 0; // varsayılan miktar
              this.products.push(p);
            });
          }
        });

        // Form alanlarını eşleyelim
        const fields = categoryData.fields || [];
        this.categoryFields = fields.map((f: any) => ({
          ...f,
          tip: f.tip ? f.tip.trim().toLowerCase() : 'text',
          fiyat_etkisi: f.fiyat_etkisi || 'none',
          carpan_turu: f.carpan_turu || 'kendi_icinde'
        }));
      }

      // Bu catering kategorisine ait önerilen hazır menüleri (paketleri) çekelim
      try {
        this.recommendedMenus = await this.dataService.getFeaturedMenus(this.categoryId) || [];
      } catch (recErr) {
        console.log('Önerilen menüler yüklenemedi:', recErr);
        this.recommendedMenus = [];
      }

      this.calculateTotal();

      // Tarih/datetime alanlarına varsayılan bugünün tarihini ata
      this.categoryFields.forEach(field => {
        if (field.tip && (field.tip.includes('date') || field.tip.includes('time'))) {
          if (!this.formData[field.name]) {
            this.formData[field.name] = new Date().toISOString();
          }
        }
      });

      // Eğer varsayılan bir adres varsa onu seçelim
      const defaultAddr = this.addresses.find(a => a.varsayilan == 1);
      if (defaultAddr) {
        this.onAddressSelect(defaultAddr.id);
      }

      // Eğer ana sayfadan veya dışarıdan önerilen menü (paket) tıklanarak gelindiyse
      const targetMenuId = this.route.snapshot.queryParams['menu_id'];
      if (targetMenuId) {
        this.selectRecommendedMenuById(targetMenuId);
      } else {
        // Normal tekil ürün yönlendirmesi varsa (fallback)
        const targetProductId = this.route.snapshot.queryParams['product_id'];
        if (targetProductId && this.products) {
          const product = this.products.find(p => p.id == targetProductId);
          if (product) {
            product.quantity = 1;
            this.calculateTotal();
          }
        }
      }

    } catch (error) {
      console.error(error);
      this.presentToast('Veriler yüklenirken bir hata oluştu.');
    } finally {
      loading.dismiss();
    }
  }

  selectRecommendedMenuById(menuId: any) {
    this.selectedMenuId = menuId;
    if (!this.recommendedMenus || this.recommendedMenus.length === 0) {
      setTimeout(() => {
        const menu = this.recommendedMenus.find(m => m.id == menuId);
        if (menu) this.applyRecommendedMenu(menu);
      }, 1000);
      return;
    }
    const menu = this.recommendedMenus.find(m => m.id == menuId);
    if (menu) {
      this.applyRecommendedMenu(menu);
    }
  }

  selectRecommendedMenu(menu: any) {
    if (this.selectedMenuId == menu.id) {
      this.selectedMenuId = null;
      this.products.forEach(p => p.quantity = 0);
      this.calculateTotal();
      this.presentToast('Önerilen paket seçimi iptal edildi. Kendi menünüzü oluşturabilirsiniz.', 'warning');
      return;
    }
    this.selectedMenuId = menu.id;
    this.applyRecommendedMenu(menu);
  }

  applyRecommendedMenu(menu: any) {
    if (menu && menu.urunler) {
      this.products.forEach(p => p.quantity = 0);
      menu.urunler.forEach((mu: any) => {
        const prod = this.products.find(p => p.id == mu.id);
        if (prod) {
          prod.quantity = 1;
        }
      });
      this.calculateTotal();
      this.presentToast(`"${menu.baslik}" paketi uygulandı.`, 'success');
    }
  }

  getSelectedMenuProducts(): any[] {
    if (!this.selectedMenuId || !this.recommendedMenus) return [];
    const menu = this.recommendedMenus.find(m => m.id == this.selectedMenuId);
    return menu ? (menu.urunler || []) : [];
  }

  async onCityChange() {
    this.deliveryFee = 0;
    this.deliveryData.district_id = '';
    if (this.deliveryData.city_id) {
      this.districts = await this.dataService.getDistricts(Number(this.deliveryData.city_id));
    } else {
      this.districts = [];
    }
    this.filteredDistricts = [...this.districts];
    this.calculateTotal();
  }

  onDistrictChange(districtId: any) {
    const dist = this.districts.find(d => d.id == districtId);
    if (dist) {
      // Teslimat ücretini al (API'den gelen alana göre: teslimat_ucreti, teslimat_fiyati veya fiyat)
      this.deliveryFee = Number(dist.teslimat_ucreti || dist.teslimat_fiyati || dist.fiyat || 0);
    } else {
      this.deliveryFee = 0;
    }
    this.calculateTotal();
  }

  onAddressSelect(addressId: any) {
    if (addressId === '') {
      this.deliveryData.city_id = '';
      this.deliveryData.district_id = '';
      this.deliveryData.address_text = '';
      return;
    }

    const addr = this.addresses.find(a => a.id == addressId);
    if (addr) {
      this.deliveryData.selected_address_id = addr.id;
      this.deliveryData.city_id = addr.il_id;
      this.onCityChange().then(() => {
         this.deliveryData.district_id = addr.ilce_id;
      });
      this.deliveryData.address_text = addr.adres;

      let addrPhone = addr.telefon || '';
      if (addrPhone) {
        const cleanVal = addrPhone.replace(/\D/g, '');
        if (cleanVal.length > 0) {
          let val = cleanVal;
          if (!val.startsWith('0')) {
            val = '0' + val;
          }
          let formatted = val.substring(0, 4);
          if (val.length > 4) formatted += ' ' + val.substring(4, 7);
          if (val.length > 7) formatted += ' ' + val.substring(7, 9);
          if (val.length > 9) formatted += ' ' + val.substring(9, 11);
          addrPhone = formatted;
        }
        this.userData.telefon = addrPhone;
      }
    }
  }

  getSelectedCityName(): string {
    if (!this.deliveryData.city_id) return '';
    const city = this.cities.find(c => c.id == this.deliveryData.city_id);
    return city ? city.il_adi : '';
  }

  getSelectedDistrictName(): string {
    if (!this.deliveryData.district_id) return '';
    const dist = this.districts.find(d => d.id == this.deliveryData.district_id);
    return dist ? dist.ilce_adi : '';
  }

  turkishToLower(str: string): string {
    if (!str) return '';
    return str
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .replace(/Ş/g, 'ş')
      .replace(/Ğ/g, 'ğ')
      .replace(/Ç/g, 'ç')
      .replace(/Ü/g, 'ü')
      .replace(/Ö/g, 'ö')
      .toLowerCase();
  }

  filterCities(event: any) {
    const val = event.detail.value;
    if (val && val.trim() !== '') {
      const query = this.turkishToLower(val);
      this.filteredCities = this.cities.filter(city => 
        this.turkishToLower(city.il_adi).includes(query)
      );
    } else {
      this.filteredCities = [...this.cities];
    }
  }

  filterDistricts(event: any) {
    const val = event.detail.value;
    if (val && val.trim() !== '') {
      const query = this.turkishToLower(val);
      this.filteredDistricts = this.districts.filter(dist => 
        this.turkishToLower(dist.ilce_adi).includes(query)
      );
    } else {
      this.filteredDistricts = [...this.districts];
    }
  }

  openCityPicker() {
    this.filteredCities = [...this.cities];
    this.isCityModalOpen = true;
  }

  openDistrictPicker() {
    if (!this.deliveryData.city_id) {
      this.presentToast('Önce bir il seçiniz.', 'warning');
      return;
    }
    this.filteredDistricts = [...this.districts];
    this.isDistrictModalOpen = true;
  }

  selectCity(city: any) {
    this.deliveryData.city_id = city.id;
    this.onCityChange();
    this.isCityModalOpen = false;
  }

  selectDistrict(dist: any) {
    this.deliveryData.district_id = dist.id;
    this.onDistrictChange(dist.id);
    this.isDistrictModalOpen = false;
  }

  isStep1Valid(): boolean {
    const selected = this.products ? this.products.filter(p => p.quantity > 0) : [];
    if (selected.length === 0) {
      this.presentToast('Lütfen en az bir ürün seçiniz.');
      return false;
    }
    for (let field of this.categoryFields) {
       if (field.zorunlu && !this.formData[field.name]) {
          this.presentToast(`Lütfen "${field.etiket}" alanını doldurun.`);
          return false;
       }
    }
    return true;
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return this.isStep1Valid();
    }
    
    if (step === 2) {
      if (!this.deliveryData.city_id || !this.deliveryData.district_id || !this.deliveryData.address_text) {
        this.presentToast('Lütfen teslimat bilgilerini eksiksiz doldurun.');
        return false;
      }
      if (!this.userData.ad_soyad || !this.userData.telefon) {
        this.presentToast('Lütfen iletişim bilgilerini doldurun.');
        return false;
      }
      const phoneRegex = /^(05[0-9]{2})\s([0-9]{3})\s([0-9]{2})\s([0-9]{2})$/;
      if (!phoneRegex.test(this.userData.telefon)) {
        this.presentToast('Lütfen geçerli bir telefon numarası giriniz (Örn: 05XX XXX XX XX).');
        return false;
      }
      return true;
    }
    
    if (step === 3) {
      if (!this.paymentMethod) {
        this.presentToast('Lütfen bir ödeme yöntemi seçiniz.');
        return false;
      }
      return true;
    }
    
    return true;
  }

  goToStep(targetStep: number) {
    if (targetStep === this.currentStep) return;

    if (targetStep < this.currentStep) {
      this.currentStep = targetStep;
      if (targetStep === 1) {
        this.activeGroupIndex = 0;
      }
      this.calculateTotal();
      window.scrollTo(0,0);
      return;
    }

    for (let s = this.currentStep; s < targetStep; s++) {
      if (!this.isStepValid(s)) {
        return;
      }
    }

    this.currentStep = targetStep;
    this.calculateTotal();
    window.scrollTo(0,0);
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.activeGroupIndex < this.groupedProducts.length - 1) {
        this.activeGroupIndex++;
        window.scrollTo(0,0);
      } else if (this.activeGroupIndex === this.groupedProducts.length - 1) {
        const selected = this.products ? this.products.filter(p => p.quantity > 0) : [];
        if (selected.length === 0) {
          this.presentToast('Lütfen en az bir ürün seçiniz.');
          return;
        }
        this.activeGroupIndex++;
        window.scrollTo(0,0);
      } else if (this.activeGroupIndex === this.groupedProducts.length) {
        for (let field of this.categoryFields) {
           if (field.zorunlu && !this.formData[field.name]) {
              this.presentToast(`Lütfen "${field.etiket}" alanını doldurun.`);
              return;
           }
        }
        this.currentStep = 2;
        window.scrollTo(0,0);
      }
    } else {
      if (!this.isStepValid(this.currentStep)) {
        return;
      }
      if (this.currentStep < 4) {
        this.currentStep++;
        this.calculateTotal();
        window.scrollTo(0,0);
      }
    }
  }

  prevStep() {
    if (this.currentStep === 1) {
      if (this.activeGroupIndex > 0) {
        this.activeGroupIndex--;
        window.scrollTo(0,0);
      }
    } else {
      this.currentStep--;
      if (this.currentStep === 1) {
        this.activeGroupIndex = this.groupedProducts.length;
      }
      this.calculateTotal();
      window.scrollTo(0,0);
    }
  }

  calculateTotal() {
    if (this.products) {
      this.selectedProducts = this.products.filter(p => p.quantity > 0);
    } else {
      this.selectedProducts = [];
    }

    let subtotal = 0;
    this.selectedProducts.forEach(p => {
      subtotal += Number(p.fiyat) * Number(p.quantity);
    });

    let extra = 0;
    let multiplicationFactors = 1;

    if (this.categoryFields) {
      this.categoryFields.forEach(field => {
        const val = this.formData[field.name];
        if (val) {
          // Mevcut ara toplama göre bu alanın fiyat etkisini hesapla
          const fieldImpact = this.getFieldPrice(field, val, subtotal + extra);
          extra += fieldImpact;
        }
      });
    }

    this.totalPrice = subtotal + extra + (this.deliveryFee || 0);
    this.totalPrice = Number(this.totalPrice.toFixed(2));
  }

  async submitOrder() {
    const loading = await this.loadingController.create({
      message: 'Siparişiniz gönderiliyor...'
    });
    await loading.present();

    try {
      let addressId = this.deliveryData.selected_address_id;

      // EĞER yeni adres girildiyse önce o adresi kaydetmeliyiz ki address_id alabilelim.
      if (!addressId) {
          const addrRes = await this.dataService.addAddress({
              adres_baslik: 'Mobil Sipariş Adresi',
              il_id: this.deliveryData.city_id,
              ilce_id: this.deliveryData.district_id,
              adres: this.deliveryData.address_text,
              telefon: this.userData.telefon,
              varsayilan: 0
          });
          if (addrRes && addrRes.status) {
              addressId = addrRes.id;
          } else {
              this.presentToast('Adres kaydedilemedi, lütfen tekrar deneyin.');
              loading.dismiss();
              return;
          }
      }

      // Toplam fiyatı son kez hesapla
      this.calculateTotal();

      const orderData = {
        kategori_id: this.categoryId,
        address_id: addressId,
        urunler: this.selectedProducts.map(p => ({ id: p.id, miktar: p.quantity })),
        form_data: this.formData,
        notes: '',
        payment_method: this.paymentMethod,
        toplam_tutar: this.totalPrice,
        teslimat_ucreti: this.deliveryFee
      };

      const response = await this.dataService.createOrder(orderData);
      if (response.status) {
        this.presentToast('Siparişiniz başarıyla alındı!', 'success');
        this.router.navigate(['/secure/orders']);
      } else {
        this.presentToast('Hata: ' + response.message);
      }
    } catch (error) {
      console.error(error);
      this.presentToast('Sipariş gönderilirken bir hata oluştu.');
    } finally {
      loading.dismiss();
    }
  }

  formatPhone(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 11) {
      val = val.substring(0, 11);
    }
    
    let formatted = '';
    if (val.length > 0) {
      if (!val.startsWith('0')) {
        val = '0' + val;
      }
      formatted = val.substring(0, 4);
      if (val.length > 4) {
        formatted += ' ' + val.substring(4, 7);
      }
      if (val.length > 7) {
        formatted += ' ' + val.substring(7, 9);
      }
      if (val.length > 9) {
        formatted += ' ' + val.substring(9, 11);
      }
    }
    
    event.target.value = formatted;
    this.userData.telefon = formatted;
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

}
