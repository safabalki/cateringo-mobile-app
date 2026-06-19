import { AfterContentChecked, ChangeDetectorRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { SwiperComponent } from 'swiper/angular';
import SwiperCore, { SwiperOptions, Pagination } from 'swiper';
SwiperCore.use([Pagination]);

import { Router } from '@angular/router';
import { DataService } from 'src/app/services/helper/data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class WelcomePage implements AfterContentChecked {

  language: string = '';
  last_slide: boolean = false;
  settings: any;
  uploadUrl = environment.uploadUrl;

  @ViewChild('swiper') swiper: SwiperComponent;

  // Swiper config
  config: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 50,
    pagination: { clickable: false },
    allowTouchMove: true // set true to allow swiping
  }

  constructor(
    private router: Router,
    private ref: ChangeDetectorRef,
    private dataService: DataService
  ) { }

  async ngOnInit() {
    this.settings = await this.dataService.getSettings();
  }

  ngAfterContentChecked(): void {

    if (this.swiper) {
      this.swiper.updateSwiper({});
    }
  }

  // Trigger swiper slide change
  swiperSlideChanged(e) {
    const swiperInstance = Array.isArray(e) ? e[0] : e;
    if (swiperInstance) {
      this.last_slide = swiperInstance.isEnd;
      this.ref.detectChanges();
    }
  }

  // Go to next slide
  nextSlide() {
    this.swiper.swiperRef.slideNext(500);
  }

  // Last slide trigger
  onLastSlide() {
    this.last_slide = true;
    this.ref.detectChanges();
  }

  // Go to main content
  async getStarted() {

    // Navigate to /dashboard
    this.router.navigateByUrl('/signin');
  }

}
