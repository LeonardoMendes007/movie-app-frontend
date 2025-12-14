import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MovieSummary } from '../../../../core/models/movie.models';
import { MovieCardComponent } from '../../../../shared/components/movie-card/movie-card.component';

@Component({
  selector: 'app-movie-carousel',
  standalone: true,
  imports: [CommonModule, MovieCardComponent],
  template: `
    <div class="relative">
      <div 
        class="flex space-x-4 overflow-x-scroll scrollbar-hide snap-x snap-mandatory p-1"
        style="-ms-overflow-style: none; scrollbar-width: none;"
      >
        <app-movie-card 
          *ngFor="let movie of movies" 
          [movie]="movie"
          class="min-w-[120px] max-w-[120px] md:min-w-[140px] md:max-w-[140px] lg:min-w-[160px] lg:max-w-[160px] snap-start"
        ></app-movie-card>
      </div>
    </div>
  `,
  styles: [`
    /* Esconde a barra de rolagem (Tailwind 'scrollbar-hide' é um alias para este CSS) */
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class MovieCarouselComponent {
  @Input({ required: true }) movies!: MovieSummary[] | null;
}