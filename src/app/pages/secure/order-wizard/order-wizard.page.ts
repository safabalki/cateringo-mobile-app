import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../services/helper/data.service';
import { LoadingController, ToastController, ModalController, ActionSheetController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

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
    private actionSheetController: ActionSheetController
  ) { }

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
      const [allCategoriesArr, citiesArr, profileData, settingsData] = await Promise.all([
        this.dataService.getCategories(),
        this.dataService.getCities(),
        this.dataService.getProfile(),
        this.dataService.getSettings()
      ]);

      const allCategories = allCategoriesArr || [];
      this.category = allCategories.find((c: any) => c.id == this.categoryId);
      this.cities = citiesArr || [];
      this.filteredCities = [...this.cities];
      this.siteSettings = settingsData;
      
      if (profileData) {
        this.userData = {
          ad_soyad: profileData.ad_soyad || '',
          email: profileData.email || '',
          telefon: profileData.telefon || ''
        };
      }

      // Adresleri ve ürünleri de çekelim
      this.addresses = await this.dataService.getAddresses();
      this.products = await this.dataService.getProducts(this.categoryId);
      const fields = await this.dataService.getCategoryFields(this.categoryId);
      this.categoryFields = fields.map((f: any) => ({
        ...f,
        tip: f.tip ? f.tip.trim().toLowerCase() : 'text',
        fiyat_etkisi: f.fiyat_etkisi || 'none',
        carpan_turu: f.carpan_turu || 'kendi_icinde'
      }));

      // Ürünlerin miktarını 0 yapalım varsayılan
      this.products.forEach(p => p.quantity = 0);

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

    } catch (error) {
      console.error(error);
      this.presentToast('Veriler yüklenirken bir hata oluştu.');
    } finally {
      loading.dismiss();
    }
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

  nextStep() {
    if (this.currentStep === 1) {
      this.selectedProducts = this.products.filter(p => p.quantity > 0);
      if (this.selectedProducts.length === 0) {
        this.presentToast('Lütfen en az bir ürün seçiniz.');
        return;
      }
      // Zorunlu alan kontrolü
      for (let field of this.categoryFields) {
         if (field.zorunlu && !this.formData[field.name]) {
            this.presentToast(`Lütfen "${field.etiket}" alanını doldurun.`);
            return;
         }
      }
    } else if (this.currentStep === 2) {
      if (!this.deliveryData.city_id || !this.deliveryData.district_id || !this.deliveryData.address_text) {
        this.presentToast('Lütfen teslimat bilgilerini eksiksiz doldurun.');
        return;
      }
      if (!this.userData.ad_soyad || !this.userData.telefon) {
        this.presentToast('Lütfen iletişim bilgilerini doldurun.');
        return;
      }
    }

    if (this.currentStep < 4) {
      this.currentStep++;
      this.calculateTotal();
      window.scrollTo(0,0);
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0,0);
    }
  }

  calculateTotal() {
    let subtotal = 0;
    this.selectedProducts.forEach(p => {
      subtotal += Number(p.fiyat) * Number(p.quantity);
    });

    let extra = 0;
    let multiplicationFactors = 1;

    this.categoryFields.forEach(field => {
      const val = this.formData[field.name];
      if (val) {
        // Mevcut ara toplama göre bu alanın fiyat etkisini hesapla
        const fieldImpact = this.getFieldPrice(field, val, subtotal + extra);
        extra += fieldImpact;
      }
    });

    this.totalPrice = subtotal + extra + this.deliveryFee;
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
