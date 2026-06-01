import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DataService } from '../../../services/helper/data.service';
import { ToastService } from '../../../services/toast/toast.service';
import { LoadingController } from '@ionic/angular';

import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  profileForm: UntypedFormGroup;
  content_loaded: boolean = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private dataService: DataService,
    private toastService: ToastService,
    private loadingController: LoadingController,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.profileForm = this.formBuilder.group({
      ad: ['', Validators.required],
      soyad: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      telefon: ['', [Validators.required, Validators.pattern(/^(05[0-9]{2}\s[0-9]{3}\s[0-9]{2}\s[0-9]{2})$/)]],
      sifre: [''] // Optional password update
    });
    this.loadProfile();
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
    this.profileForm.get('telefon').setValue(formatted, { emitEvent: false });
  }

  async loadProfile() {
    try {
      const user = await this.dataService.getProfile();
      if (user) {
        let ad = user.ad || '';
        let soyad = user.soyad || '';
        
        if (!ad && !soyad && user.ad_soyad) {
          const parts = user.ad_soyad.trim().split(' ');
          ad = parts[0];
          soyad = parts.slice(1).join(' ');
        }

        let loadedPhone = user.telefon || '';
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

        this.profileForm.patchValue({
          ad: ad,
          soyad: soyad,
          email: user.email,
          telefon: loadedPhone
        });
        this.content_loaded = true;
      } else {
        // Token invalid or user not found
        this.signOut();
      }
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      this.signOut();
    }
  }

  async signOut() {
    await this.authService.signOut();
  }

  async updateProfile() {
    const loading = await this.loadingController.create({
      message: 'Güncelleniyor...'
    });
    await loading.present();

    try {
      const res = await this.dataService.updateProfile(this.profileForm.getRawValue());
      if (res && res.status) {
        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }
        this.toastService.presentToast('Başarılı', 'Profiliniz güncellendi.', 'top', 'success', 2000);
      } else {
        this.toastService.presentToast('Hata', (res ? res.message : 'Güncelleme yapılamadı'), 'top', 'danger', 2000);
      }
    } catch (error) {
      this.toastService.presentToast('Hata', 'İşlem sırasında bir hata oluştu.', 'top', 'danger', 2000);
    } finally {
      loading.dismiss();
    }
  }

}
