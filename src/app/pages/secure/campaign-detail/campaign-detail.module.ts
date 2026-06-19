import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CampaignDetailPageRoutingModule } from './campaign-detail-routing.module';

import { CampaignDetailPage } from './campaign-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CampaignDetailPageRoutingModule
  ],
  declarations: [CampaignDetailPage]
})
export class CampaignDetailPageModule {}
