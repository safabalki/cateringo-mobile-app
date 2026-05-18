import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  private getHeaders() {
    const token = localStorage.getItem('api_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', token);
    }
    
    return headers;
  }

  private handleResponse(response: any) {
    if (response && response.status === false && response.message === 'Geçersiz token.') {
      localStorage.removeItem('api_token');
      localStorage.removeItem('user');
      this.router.navigateByUrl('/signin');
      return null;
    }
    return response;
  }

  get(endpoint: string, params: any = {}): Observable<any> {
    return this.http.get(this.baseUrl + endpoint, { 
      headers: this.getHeaders(),
      params: params 
    }).pipe(
      map(res => this.handleResponse(res))
    );
  }

  post(endpoint: string, data: any): Observable<any> {
    return this.http.post(this.baseUrl + endpoint, data, { 
      headers: this.getHeaders() 
    }).pipe(
      map(res => this.handleResponse(res))
    );
  }

  // Auth gerektiren post işlemleri için (örneğin FormData gerekiyorsa)
  postPlain(endpoint: string, data: any): Observable<any> {
    return this.http.post(this.baseUrl + endpoint, data).pipe(
      map(res => this.handleResponse(res))
    );
  }
}
