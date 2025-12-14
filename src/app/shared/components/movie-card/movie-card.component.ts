import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieSummary } from '../../../core/models/movie.models';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div 
      class="bg-dark-800 rounded-lg overflow-hidden shadow-xl 
             transform hover:scale-[1.03] transition-transform duration-300 
             cursor-pointer group relative w-full h-full"
    >
      <a 
        [routerLink]="['/movie', movie.id]" 
        class="block w-full h-full aspect-[2/3] group/link"
      >
        <img 
          [src]="movie.imageUrl" 
          [alt]="movie.name" 
          class="w-full h-full object-cover"
        >
      </a>

      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-300">
        <button 
          [routerLink]="['/movie', movie.id]"
          class="text-white text-3xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 
                 transition-all duration-300 bg-primary/80 hover:bg-primary rounded-full p-4"
          aria-label="Assistir"
        >
          ▶
        </button>
      </div>

      <div class="p-3 text-sm absolute bottom-0 w-full bg-gradient-to-t from-dark-900 to-transparent">
        <h3 class="font-semibold text-white truncate">{{ movie.name }}</h3>
        <p class="text-gray-400 text-xs mt-1">
          Visualizações: {{ movie.views | number }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .movie-card {
      width: 100%;
      height: 100%;
      aspect-ratio: 2/3; /* Proporção de poster */
    }
  `]
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: MovieSummary;
}