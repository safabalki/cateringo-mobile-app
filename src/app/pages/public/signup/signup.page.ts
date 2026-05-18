import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/helper/data.service';
import { environment } from 'src/environments/environment';

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
      telefon: ['', Validators.compose([Validators.required])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])],
      password_repeat: ['', Validators.compose([Validators.minLength(6), Validators.required])]
    });

    this.settings = await this.dataService.getSettings();
  }

  // Sign up
  async signUp() {

    this.submit_attempt = true;

    // If any field is empty
    const { ad_soyad, email, telefon, password, password_repeat } = this.signup_form.value;
    if (!ad_soyad || !email || !telefon || !password || !password_repeat) {
      this.toastService.presentToast('Hata', 'Lütfen tüm alanları doldurun', 'top', 'danger', 4000);

      // If passwords do not match
    } else if (password != password_repeat) {
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

}
