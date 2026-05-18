import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../helper/api.service';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private router: Router,
    private api: ApiService
  ) { }

  // Get user session
  async getSession() {
    const token = localStorage.getItem('api_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  // Sign in
  async signIn(email: string, password: string) {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const response = await firstValueFrom(this.api.postPlain('login', formData));
      if (response && response.status) {
        // API'den dönen "token" veya "api_token" alanını kullanıyoruz
        const authToken = response.user.token || response.user.api_token;
        localStorage.setItem('api_token', authToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response.user;
      }
      return false;
    } catch (error) {
      console.error('Login error', error);
      throw error;
    }
  }

  // Sign up
  async signUp(userData: any) {
    const formData = new FormData();
    formData.append('ad_soyad', userData.ad_soyad);
    formData.append('email', userData.email);
    formData.append('telefon', userData.telefon);
    formData.append('password', userData.password);

    try {
      const response = await firstValueFrom(this.api.postPlain('register', formData));
      return response;
    } catch (error) {
      console.error('Register error', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    localStorage.removeItem('api_token');
    localStorage.removeItem('user');
    this.router.navigateByUrl('/signin');
  }
}
