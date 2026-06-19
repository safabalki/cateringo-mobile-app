import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../../services/helper/data.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
})
export class OrderDetailPage implements OnInit {

  orderId: number;
  order: any;
  content_loaded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.orderId = +this.route.snapshot.paramMap.get('id');
    this.loadOrderDetail();
  }

  async loadOrderDetail() {
    try {
      this.order = await this.dataService.getOrderDetail(this.orderId);
      if (this.order) {
        if (this.order.order && this.order.order.created_at) {
          // MySQL tarih formatını (YYYY-MM-DD HH:MM:SS) iOS/Safari uyumlu ISO formatına (YYYY-MM-DDTHH:MM:SS) dönüştürüyoruz.
          this.order.order.created_at = this.order.order.created_at.replace(' ', 'T');
        }
        if (this.order.details) {
          // Hesaplama hatasını önlemek için detaylardaki fiyatları kendimiz de toplayalım.
          const calculatedSum = this.sumTotal(this.order.details);
          // API'den gelen toplam 0 ise veya detayların toplamı daha yüksekse (teslimat dahil değilse vb.) düzeltelim.
          if (this.order.order && (Number(this.order.order.toplam_tutar) === 0 || Number(this.order.order.toplam_tutar) < calculatedSum)) {
            this.order.order.toplam_tutar = calculatedSum.toString();
          }
        }
      }
    } catch (error) {
      console.error('Sipariş detayı yüklenirken hata:', error);
    } finally {
      this.content_loaded = true;
    }
  }

  sumTotal(details: any[]): number {
    let total = 0;
    details.forEach(item => {
      // Eğer fiyat_degeri varsa onu kullan, yoksa deger içinden ayıkla
      let val = Number(item.fiyat_degeri || 0);
      if (val === 0 && item.deger && item.deger.includes('TL')) {
         // Regex ile "100.00 TL" gibi ifadelerdeki sayıyı bul (Son eşleşmeyi alıyoruz çünkü genelde '.. = 100 TL' formatında en sondadır)
         const matches = item.deger.match(/(\d+(\.\d+)?)/g);
         if (matches) {
            // Eğer "1 adet x 100 = 100 TL" ise en sondaki 100'ü al.
            // Eğer sadece "100.00 TL" ise ilkini al. (matches.length-1 her iki durumu da çözer)
            const lastVal = Number(matches[matches.length - 1]);
            if (!isNaN(lastVal)) val = lastVal;
         }
      }
      total += val;
    });
    return total;
  }

  getStatusColor(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('bekle')) return 'warning';
    if (s.includes('hazır') || s.includes('onay')) return 'success';
    if (s.includes('iptal')) return 'danger';
    if (s.includes('yol')) return 'primary';
    return 'medium';
  }

}
