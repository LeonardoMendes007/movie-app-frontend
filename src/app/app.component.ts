import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Componentes Reutilizáveis (serão criados futuramente em src/app/shared/)
// Como o Navbar é global e a maior parte da app é protegida, ele fica aqui.
import { AuthService } from './core/auth/auth.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    // Importamos o Navbar aqui para ele aparecer em todas as rotas filhas
    NavbarComponent,
  ],
  template: `
    <app-navbar *ngIf="shouldShowNavbar()"></app-navbar>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private authService = inject(AuthService);

  // Lógica simples para determinar se o Navbar deve ser exibido.
  // Se o usuário estiver logado, mostramos.
  // Em apps mais complexas, você usaria o Router para verificar a URL atual
  // e esconder em rotas específicas (ex: /auth/login, /auth/register).
  shouldShowNavbar(): boolean {
    return this.authService.currentUser() !== null;
  }
}