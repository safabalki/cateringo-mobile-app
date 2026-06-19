import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/services/helper/data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-campaign-detail',
  templateUrl: './campaign-detail.page.html',
  styleUrls: ['./campaign-detail.page.scss'],
})
export class CampaignDetailPage implements OnInit {

  campaignId: number;
  campaign: any;
  uploadUrl = environment.uploadUrl;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) { }

  async ngOnInit() {
    this.campaignId = +this.route.snapshot.paramMap.get('id');
    if (this.campaignId) {
      try {
        this.campaign = await this.dataService.getCampaignDetail(this.campaignId);
      } catch (err) {
        console.log('Kampanya detayı yüklenemedi:', err);
      }
    }
  }
}
