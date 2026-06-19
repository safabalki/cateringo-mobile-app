import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CampaignDetailPage } from './campaign-detail.page';

const routes: Routes = [
  {
    path: '',
    component: CampaignDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampaignDetailPageRoutingModule {}
