import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/services/toast/toast.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/helper/data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {

  current_year: number = new Date().getFullYear();

  signin_form: UntypedFormGroup;
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
    this.signin_form = this.formBuilder.group({
      email: ['', Validators.compose([Validators.email, Validators.required])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])]
    });

    // DEBUG: Prefill inputs - settings gelmeden önce yapabiliriz
    this.signin_form.get('email').setValue('info@cateringo.com');
    this.signin_form.get('password').setValue('123456');

    // Load settings after form is ready to avoid template errors
    this.settings = await this.dataService.getSettings();
  }

  // Sign in
  async signIn() {

    this.submit_attempt = true;

    // If email or password empty
    if (this.signin_form.value.email == '' || this.signin_form.value.password == '') {
      this.toastService.presentToast('Error', 'Please input email and password', 'top', 'danger', 2000);

    } else {

      const loading = await this.loadingController.create({
        message: 'Giriş yapılıyor...'
      });
      await loading.present();

      try {
        const user = await this.authService.signIn(this.signin_form.value.email, this.signin_form.value.password);
        if (user) {
          await this.router.navigate(['/secure/home']);
        } else {
          this.toastService.presentToast('Hata', 'Giriş yapılamadı, lütfen bilgilerinizi kontrol edin.', 'top', 'danger', 2000);
        }
      } catch (error: any) {
        console.error('SignIn error details:', error); // Detaylı hata konsola (Android Studio)
        let message = 'Sunucuya bağlanılamadı.';
        if (error.error && error.error.message) {
          message = error.error.message;
        } else if (error.status === 0) {
          message = 'Bağlantı reddedildi. SSL sertifikası geçersiz olabilir.';
        }
        this.toastService.presentToast('Hata', message, 'top', 'danger', 4000);
      } finally {
        loading.dismiss();
      }

    }
  }

}
