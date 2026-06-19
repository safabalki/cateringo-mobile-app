import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./../../tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'cart',
    loadChildren: () => import('./cart/cart.module').then( m => m.CartPageModule)
  },
  {
    path: 'restaurants/detail/:id',
    loadChildren: () => import('./restaurants/detail/detail.module').then( m => m.DetailPageModule)
  },
  {
    path: 'restaurants/detail/dish',
    loadChildren: () => import('./restaurants/dish/dish.module').then( m => m.DishPageModule)
  },
  {
    path: 'orders',
    loadChildren: () => import('./orders/orders.module').then( m => m.OrdersPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'order-detail/:id',
    loadChildren: () => import('./order-detail/order-detail.module').then( m => m.OrderDetailPageModule)
  },
  {
    path: 'order-wizard/:id',
    loadChildren: () => import('./order-wizard/order-wizard.module').then( m => m.OrderWizardPageModule)
  },
  {
    path: 'addresses',
    loadChildren: () => import('./addresses/addresses.module').then( m => m.AddressesPageModule)
  },  {
    path: 'campaign-detail/:id',
    loadChildren: () => import('./campaign-detail/campaign-detail.module').then( m => m.CampaignDetailPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecureRoutingModule { }
