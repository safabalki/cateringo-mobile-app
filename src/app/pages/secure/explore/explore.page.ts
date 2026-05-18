import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
})
export class ExplorePage implements OnInit {

  content_loaded: boolean = false;

  constructor() { }

  ngOnInit() {

    // Fake timeout since we do not load any data
    setTimeout(() => {
      this.content_loaded = true;
    }, 1000);
  }

  ionViewWillEnter() {
    // Fake timeout since we do not load any data
    setTimeout(() => {
      this.content_loaded = true;
    }, 1000);
  }

  ionViewWillLeave() {
    this.content_loaded = false;
  }

  // Open filter
  openFilter() {

  }

}
