import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderWizardPage } from './order-wizard.page';

const routes: Routes = [
  {
    path: '',
    component: OrderWizardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderWizardPageRoutingModule {}
