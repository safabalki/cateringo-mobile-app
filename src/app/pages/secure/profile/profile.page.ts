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
      telefon: ['', Validators.required],
      sifre: [''] // Optional password update
    });
    this.loadProfile();
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

        this.profileForm.patchValue({
          ad: ad,
          soyad: soyad,
          email: user.email,
          telefon: user.telefon
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
