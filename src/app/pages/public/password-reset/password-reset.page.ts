import { Component, OnInit } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { DataService } from 'src/app/services/helper/data.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth/auth.service';

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
    private dataService: DataService,
    private authService: AuthService
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
      message: 'Şifre sıfırlama isteği gönderiliyor...'
    });
    await loading.present();

    try {
      const response = await this.authService.requestPasswordReset(this.email);
      if (response && response.status) {
        this.presentToast(response.message || 'Geçici şifreniz e-posta adresinize gönderildi.', 'success');
        this.email = "";
      } else {
        this.presentToast(response.message || 'Şifre sıfırlama başarısız oldu.', 'danger');
      }
    } catch (error: any) {
      console.error('Password reset page error:', error);
      let message = 'E-posta adresi bulunamadı veya sunucu hatası oluştu.';
      if (error.error && error.error.message) {
        message = error.error.message;
      }
      this.presentToast(message, 'danger');
    } finally {
      loading.dismiss();
    }
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
