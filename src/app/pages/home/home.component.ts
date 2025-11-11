import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  async logout() {
    await this.authService.signOut();
  }

  get userName(): string {
    const user = this.authService.currentUser();
    return user?.user_metadata?.['fullName'] || user?.email || 'Usuario';
  }

  get userEmail(): string {
    return this.authService.currentUser()?.email || '';
  }
}

