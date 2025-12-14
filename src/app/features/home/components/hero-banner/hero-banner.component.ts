import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieSummary } from '../../../../core/models/movie.models';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div 
      *ngIf="movie" 
      class="relative w-full h-[60vh] lg:h-[85vh] rounded-xl overflow-hidden shadow-2xl"
    >
      <img 
        [src]="movie.imageUrl" 
        [alt]="movie.name" 
        class="w-full h-full object-cover object-center"
      >

      <div class="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>

      <div class="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-dark-900/80 to-transparent"></div>
      
      <div class="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-dark-900/80 to-transparent"></div>

      <div class="absolute bottom-0 left-0 p-8 lg:p-16 max-w-4xl">
        
        <h1 class="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-2xl">
          {{ movie.name }}
        </h1>
        
        <p class="text-gray-200 text-base md:text-lg mb-6 line-clamp-3 drop-shadow-xl">
          {{ movie.synopsis }}
        </p>

        <div class="flex space-x-4">
          
          <a 
            [routerLink]="['/movie', movie.id]" 
            class="flex items-center bg-white hover:bg-gray-200 text-dark-900 font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105"
          >
            <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
            Assistir Agora
          </a>

          <button 
            class="flex items-center bg-dark-700/70 hover:bg-dark-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 backdrop-blur-sm"
          >
            + Minha Lista
          </button>
        </div>

      </div>
    </div>

    <div *ngIf="!movie" class="h-[60vh] flex items-center justify-center bg-dark-800 rounded-xl">
        <p class="text-gray-400 text-lg">Carregando destaque...</p>
    </div>
  `
})
export class HeroBannerComponent {
  // Recebe um MovieSummary do HomeComponent
  @Input() movie: MovieSummary | null = null; 
}