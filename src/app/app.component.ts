// src/app/app.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>

    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  showNavbar = false;

  constructor() {
    // Escuta as mudanças de rota para decidir se mostra ou não a Navbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      
      // Lista de rotas onde a Navbar NÃO deve aparecer
      const hiddenRoutes = ['/setup-profile', '/auth/login', '/auth/register'];
      
      // Verifica se a URL atual começa com alguma das rotas escondidas
      const isHidden = hiddenRoutes.some(route => url.includes(route));
      
      // Regra final: Não está em rota escondida E usuário está logado
      this.showNavbar = !isHidden && this.authService.currentUser() !== null;
    });
  }
}