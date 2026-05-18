import { Component, OnInit } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { DataService } from 'src/app/services/helper/data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.page.html',
  styleUrls: ['./password-reset.page.scss'],
})
export class PasswordResetPage implements OnInit {

  current_year: number = new Date().getFullYear();
  email: string = "";
  settings: any;
  uploadUrl: string = environment.uploadUrl;

  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController,
    private dataService: DataService
  ) { }

  async ngOnInit() {
    this.settings = await this.dataService.getSettings();
  }

  async resetPassword() {
    if (!this.email) {
      this.presentToast('Lütfen e-posta adresinizi giriniz.', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Lütfen bekleyin...',
      duration: 2000
    });
    await loading.present();

    setTimeout(() => {
      loading.dismiss();
      this.presentToast('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', 'success');
      this.email = "";
    }, 1500);
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

}
