import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderWizardPage } from './order-wizard.page';

describe('OrderWizardPage', () => {
  let component: OrderWizardPage;
  let fixture: ComponentFixture<OrderWizardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderWizardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
