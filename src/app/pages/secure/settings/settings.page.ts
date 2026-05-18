import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DataService } from '../../../services/helper/data.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  user: any;
  orderCount: number = 0;
  settings: any;
  uploadUrl = environment.uploadUrl;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  async ionViewWillEnter() {
    this.user = await this.dataService.getProfile();
    const orders = await this.dataService.getMyOrders();
    this.orderCount = orders ? orders.length : 0;
    this.settings = await this.dataService.getSettings();
  }

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/signin'], { replaceUrl: true });
  }

}
