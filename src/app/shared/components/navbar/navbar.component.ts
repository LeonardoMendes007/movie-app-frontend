import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router'; // Importa Router
import { AuthService } from '../../../core/auth/auth.service';
import { GenreSummary } from '../../../core/models/movie.models';
import { MovieAppService } from '../../../core/services/movie-app.service';
import { ReplaceSpacesPipe } from '../../pipes/replace-spaces.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RouterLinkActive, 
    ReplaceSpacesPipe,
    FormsModule // Necessário para o [(ngModel)]
  ],
  template: `
    <nav class="sticky top-0 z-50 bg-dark-900 shadow-xl border-b border-dark-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between py-2"> 
          
          <div class="flex items-center">
            
            <a routerLink="/home" class="flex-shrink-0 text-primary text-2xl font-black tracking-wider">
              MovieApp
            </a>

            <div class="hidden md:block ml-10 space-x-4">
              <a 
                routerLink="/home" 
                routerLinkActive="text-primary border-primary"
                [routerLinkActiveOptions]="{exact: true}"
                class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent transition-colors duration-200"
              >
                Início
              </a>
              
              <div class="relative inline-block text-left group/dropdown">
                
                <a 
                  href="javascript:void(0)" 
                  class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent transition-colors duration-200 flex items-center"
                >
                  Filmes
                  <svg class="w-4 h-4 ml-1 transition-transform group-hover/dropdown:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </a>
                
                <div 
                  *ngIf="genres().length > 0"
                  class="absolute left-0 mt-0 w-56 rounded-md shadow-2xl bg-dark-800 ring-1 ring-black ring-opacity-70 focus:outline-none 
                         opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-opacity duration-200 z-50"
                  style="max-height: 400px; overflow-y: auto;"
                >
                  <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <a 
                      *ngFor="let genre of genres()" 
                      [routerLink]="['/movies/genres', genre.name | replaceSpaces: '-']"
                      class="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-primary whitespace-nowrap"
                      role="menuitem"
                    >
                      {{ genre.name }}
                    </a>
                  </div>
                </div>
              </div>
              
              <a 
                routerLink="/mylist" 
                routerLinkActive="text-primary border-primary"
                class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent transition-colors duration-200"
              >
                Minha Lista
              </a>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            
            <form (ngSubmit)="onSearchSubmit()" class="flex items-center space-x-2">
                <div class="relative">
                    <input 
                        type="text"
                        placeholder="Buscar filmes..."
                        [(ngModel)]="searchTerm"
                        name="searchTerm"
                        class="px-3 py-2 text-sm bg-dark-800 text-white rounded-lg focus:ring-primary focus:border-primary border border-transparent focus:border-opacity-100 transition duration-200 w-32 md:w-48"
                    >
                    <button type="submit" class="absolute right-0 top-0 mt-2 mr-2 text-gray-400 hover:text-primary">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </button>
                </div>
            </form>
            <div class="relative group">
              <button class="flex items-center bg-dark-700/50 p-2 rounded-full hover:bg-dark-700 transition-colors">
                <span class="text-white font-semibold w-8 h-8 flex items-center justify-center rounded-full bg-primary/70">
                {{ authService.currentUser()?.name?.[0]?.toUpperCase() || authService.currentUser()?.email?.[0]?.toUpperCase() || 'U' }}
                </span>
              </button>
              
              <div class="absolute right-0 mt-2 w-48 bg-dark-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform scale-95 group-hover:scale-100 origin-top-right">
                <div class="py-1">
                  <span class="block px-4 py-2 text-sm text-gray-300 truncate border-b border-dark-700">
                    {{ authService.currentUser()?.email }}
                  </span>
                  
                  <a href="#" class="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700">
                    Configurações
                  </a>
                  
                  <button (click)="onLogout()" class="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-dark-700">
                    Sair
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private movieService = inject(MovieAppService);

  searchTerm: string = ''; // Variável para armazenar o termo de busca

  // Signal para armazenar os gêneros
  genres = signal<GenreSummary[]>([]);

  ngOnInit(): void {
    // Busca os gêneros uma vez ao carregar o Navbar
    this.fetchGenres();
  }

  fetchGenres(): void {
    this.movieService.getAllGenres().subscribe({
      next: (data) => {
        this.genres.set(data);
      },
      error: (err) => {
        console.error('Erro ao carregar gêneros para o Navbar:', err);
      }
    });
  }
  
  onSearchSubmit(): void {
    const term = this.searchTerm.trim();
    if (term) {
        // Navega para a nova rota de resultados e limpa o campo
        this.router.navigate(['/search', term]);
        this.searchTerm = ''; 
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}