import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/helper/data.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.page.html',
  styleUrls: ['./addresses.page.scss'],
})
export class AddressesPage implements OnInit {

  addresses: any[] = [];
  content_loaded: boolean = false;
  cities: any[] = [];
  districts: any[] = [];
  
  isModalOpen: boolean = false;
  editingAddress: any = null;
  newAddress = {
    adres_baslik: '',
    il_id: '',
    ilce_id: '',
    adres: '',
    telefon: '',
    varsayilan: false
  };

  constructor(
    private dataService: DataService,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) { }

  async ngOnInit() {
    await this.loadData();
    this.cities = await this.dataService.getCities() || [];
  }

  async loadData() {
    try {
      this.addresses = await this.dataService.getAddresses() || [];
      this.content_loaded = true;
    } catch (error) {
      console.error('Adresler yüklenirken hata:', error);
    }
  }

  async onCityChange(cityId: any) {
    if (cityId) {
      this.districts = await this.dataService.getDistricts(cityId) || [];
    } else {
      this.districts = [];
    }
  }

  openAddModal() {
    this.editingAddress = null;
    this.newAddress = {
      adres_baslik: '',
      il_id: '',
      ilce_id: '',
      adres: '',
      telefon: '',
      varsayilan: false
    };
    this.districts = [];
    this.isModalOpen = true;
  }

  async editAddress(addr: any) {
    this.editingAddress = addr;
    
    let loadedPhone = addr.telefon || '';
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

    this.newAddress = {
      adres_baslik: addr.adres_baslik,
      il_id: addr.il_id,
      ilce_id: addr.ilce_id,
      adres: addr.adres,
      telefon: loadedPhone,
      varsayilan: (addr.varsayilan == 1 || addr.varsayilan === '1')
    };
    await this.onCityChange(addr.il_id);
    this.isModalOpen = true;
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
    this.newAddress.telefon = formatted;
  }

  async saveAddress() {
    if (!this.newAddress.adres_baslik || !this.newAddress.il_id || !this.newAddress.ilce_id || !this.newAddress.adres) {
      this.toastService.presentToast('Hata', 'Lütfen tüm alanları doldurun.', 'top', 'danger', 2000);
      return;
    }

    const phoneRegex = /^(05[0-9]{2})\s([0-9]{3})\s([0-9]{2})\s([0-9]{2})$/;
    if (!this.newAddress.telefon || !phoneRegex.test(this.newAddress.telefon)) {
      this.toastService.presentToast('Hata', 'Lütfen geçerli bir telefon numarası giriniz.', 'top', 'danger', 2000);
      return;
    }

    const loading = await this.loadingController.create({ message: 'Kaydediliyor...' });
    await loading.present();

    try {
      const data = {
        ...this.newAddress,
        varsayilan: this.newAddress.varsayilan ? 1 : 0,
        id: this.editingAddress ? this.editingAddress.id : null
      };
      
      const res = await this.dataService.addAddress(data);
      if (res.status) {
        this.toastService.presentToast('Başarılı', 'Adres kaydedildi.', 'top', 'success', 2000);
        this.isModalOpen = false;
        await this.loadData();
      } else {
        this.toastService.presentToast('Hata', res.message || 'Hata oluştu.', 'top', 'danger', 2000);
      }
    } catch (e) {
      this.toastService.presentToast('Hata', 'Bağlantı hatası.', 'top', 'danger', 2000);
    } finally {
      loading.dismiss();
    }
  }

  async setAsDefault(addr: any) {
    const loading = await this.loadingController.create({ message: 'Güncelleniyor...' });
    await loading.present();
    
    try {
      const data = {
        id: addr.id,
        adres_baslik: addr.adres_baslik,
        il_id: addr.il_id,
        ilce_id: addr.ilce_id,
        adres: addr.adres,
        telefon: addr.telefon,
        varsayilan: 1
      };
      
      const res = await this.dataService.addAddress(data);
      if (res.status) {
        this.toastService.presentToast('Başarılı', 'Varsayılan adres güncellendi.', 'top', 'success', 2000);
        await this.loadData();
      } else {
        this.toastService.presentToast('Hata', res.message || 'Hata oluştu.', 'top', 'danger', 2000);
      }
    } catch (e) {
      this.toastService.presentToast('Hata', 'Bağlantı hatası.', 'top', 'danger', 2000);
    } finally {
      loading.dismiss();
    }
  }

  async deleteAddress(addr: any) {
    const alert = await this.alertController.create({
      header: 'Emin misiniz?',
      message: 'Bu adresi silmek istediğinize emin misiniz?',
      buttons: [
        { text: 'Vazgeç', role: 'cancel' },
        {
          text: 'Sil',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Siliniyor...' });
            await loading.present();
            try {
              const res = await this.dataService.deleteAddress(addr.id);
              if (res.status) {
                this.toastService.presentToast('Başarılı', 'Adres silindi.', 'top', 'success', 2000);
                await this.loadData();
              } else {
                this.toastService.presentToast('Hata', res.message || 'Hata oluştu.', 'top', 'danger', 2000);
              }
            } catch (e) {
              this.toastService.presentToast('Hata', 'Sistem hatası.', 'top', 'danger', 2000);
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
