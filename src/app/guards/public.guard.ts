import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from '../services/auth/auth.service'

@Injectable({
  providedIn: 'root'
})
export class PublicGuard  {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) { }

  async canActivate(): Promise<boolean> {
    
    const is_signed_in = !!(await this.authService.getSession());

    // If signed in, redirect to home page
    if (is_signed_in) {
      this.router.navigate(['/secure/home']);
    }

    return !is_signed_in;
  }
}
