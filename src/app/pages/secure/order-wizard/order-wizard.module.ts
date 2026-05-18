import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrderWizardPageRoutingModule } from './order-wizard-routing.module';

import { OrderWizardPage } from './order-wizard.page';
import { JsonParsePipe } from '../../../pipes/json-parse.pipe';
import { FilterActivePipe } from '../../../pipes/filter-active.pipe';
import { CityNamePipe, DistrictNamePipe } from '../../../pipes/location-name.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrderWizardPageRoutingModule
  ],
  declarations: [OrderWizardPage, JsonParsePipe, FilterActivePipe, CityNamePipe, DistrictNamePipe]
})
export class OrderWizardPageModule {}
