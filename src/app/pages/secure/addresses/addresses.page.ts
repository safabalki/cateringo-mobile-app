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
    adres: ''
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
      adres: ''
    };
    this.districts = [];
    this.isModalOpen = true;
  }

  async editAddress(addr: any) {
    this.editingAddress = addr;
    this.newAddress = {
      adres_baslik: addr.adres_baslik,
      il_id: addr.il_id,
      ilce_id: addr.ilce_id,
      adres: addr.adres
    };
    await this.onCityChange(addr.il_id);
    this.isModalOpen = true;
  }

  async saveAddress() {
    if (!this.newAddress.adres_baslik || !this.newAddress.il_id || !this.newAddress.ilce_id || !this.newAddress.adres) {
      this.toastService.presentToast('Hata', 'Lütfen tüm alanları doldurun.', 'top', 'danger', 2000);
      return;
    }

    const loading = await this.loadingController.create({ message: 'Kaydediliyor...' });
    await loading.present();

    try {
      const data = {
        ...this.newAddress,
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
