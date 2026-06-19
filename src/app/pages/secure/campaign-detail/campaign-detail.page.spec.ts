import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampaignDetailPage } from './campaign-detail.page';

describe('CampaignDetailPage', () => {
  let component: CampaignDetailPage;
  let fixture: ComponentFixture<CampaignDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CampaignDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
