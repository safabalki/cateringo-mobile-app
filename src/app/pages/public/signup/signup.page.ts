import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/helper/data.service';
import { environment } from 'src/environments/environment';

declare var google: any;

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {

  current_year: number = new Date().getFullYear();

  signup_form: UntypedFormGroup;
  submit_attempt: boolean = false;
  settings: any;
  uploadUrl: string = environment.uploadUrl;

  constructor(
    private authService: AuthService,
    private loadingController: LoadingController,
    private formBuilder: UntypedFormBuilder,
    private toastService: ToastService,
    private router: Router,
    private dataService: DataService
  ) { }

  async ngOnInit() {
    // Setup form
    this.signup_form = this.formBuilder.group({
      ad_soyad: ['', Validators.compose([Validators.required])],
      email: ['', Validators.compose([Validators.email, Validators.required])],
      telefon: ['', Validators.compose([
        Validators.required,
        Validators.pattern(/^(05[0-9]{2}\s[0-9]{3}\s[0-9]{2}\s[0-9]{2})$/)
      ])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])],
      password_repeat: ['', Validators.compose([Validators.minLength(6), Validators.required])]
    });

    this.settings = await this.dataService.getSettings();
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
    this.signup_form.get('telefon').setValue(formatted, { emitEvent: false });
  }

  // Sign up
  async signUp() {

    this.submit_attempt = true;

    if (this.signup_form.invalid) {
      if (this.signup_form.get('email').hasError('email')) {
        this.toastService.presentToast('Hata', 'Geçerli bir e-posta adresi giriniz.', 'top', 'danger', 4000);
      } else if (this.signup_form.get('telefon').hasError('pattern')) {
        this.toastService.presentToast('Hata', 'Telefon formatı hatalı (Örn: 05xx xxx xx xx).', 'top', 'danger', 4000);
      } else {
        this.toastService.presentToast('Hata', 'Lütfen form alanlarını kontrol ediniz.', 'top', 'danger', 4000);
      }
      return;
    }

    const { ad_soyad, email, telefon, password, password_repeat } = this.signup_form.value;
    if (password != password_repeat) {
      this.toastService.presentToast('Hata', 'Şifreler uyuşmuyor', 'top', 'danger', 4000);

    } else {

      // Proceed with loading overlay
      const loading = await this.loadingController.create({
        message: 'Kaydınız oluşturuluyor...',
      });
      await loading.present();

      try {
        const response = await this.authService.signUp(this.signup_form.value);
        if (response && response.status) {
          this.toastService.presentToast('Başarılı', response.message || 'Kayıt başarılı! Giriş yapabilirsiniz.', 'top', 'success', 2000);
          await this.router.navigate(['/signin']);
        } else {
          this.toastService.presentToast('Hata', response.message || 'Kayıt sırasında bir hata oluştu.', 'top', 'danger', 4000);
        }
      } catch (error: any) {
        let message = 'Sunucuya bağlanılamadı.';
        if (error.error && error.error.message) {
          message = error.error.message;
        }
        this.toastService.presentToast('Hata', message, 'top', 'danger', 4000);
      } finally {
        loading.dismiss();
      }
    }

  }

  // Google ile Kaydol / Giriş Yap
  async signInWithGoogle() {
    if (!this.settings?.google_client_id) {
      this.toastService.presentToast('Hata', 'Google giriş ayarları sunucudan alınamadı.', 'top', 'danger', 2000);
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: this.settings.google_client_id,
        scope: 'email profile openid',
        callback: async (response: any) => {
          if (response.error) {
            this.toastService.presentToast('Hata', 'Google Girişi İptal Edildi.', 'top', 'danger', 2000);
            return;
          }

          if (response.access_token) {
            const loading = await this.loadingController.create({
              message: 'Google ile kaydolunuyor...'
            });
            await loading.present();

            try {
              const user = await this.authService.googleSignIn(response.access_token, true);
              if (user) {
                await this.router.navigate(['/secure/home']);
              } else {
                this.toastService.presentToast('Hata', 'Google ile kaydolma başarısız oldu.', 'top', 'danger', 2000);
              }
            } catch (error: any) {
              console.error('Google sign up error:', error);
              let message = 'İşlem başarısız oldu.';
              if (error.error && error.error.message) {
                message = error.error.message;
              }
              this.toastService.presentToast('Hata', message, 'top', 'danger', 4000);
            } finally {
              loading.dismiss();
            }
          }
        }
      });
      client.requestAccessToken();
    } catch (err) {
      console.error('Google SDK error:', err);
      this.toastService.presentToast('Hata', 'Google SDK başlatılamadı.', 'top', 'danger', 3000);
    }
  }

}
