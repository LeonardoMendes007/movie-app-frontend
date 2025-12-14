import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

// Services e Models
import { GenreSummary, MovieSummary } from '../../core/models/movie.models';
import { MovieAppService } from '../../core/services/movie-app.service';

// Componentes da Feature (Presentational)
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { HeroBannerComponent } from './components/hero-banner/hero-banner.component';
import { MovieCarouselComponent } from './components/movie-carousel/movie-carousel.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    HeroBannerComponent, 
    MovieCarouselComponent, 
    SectionTitleComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private movieService = inject(MovieAppService); 

  // Signals de Estado
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Signals de Dados
  genres = signal<GenreSummary[]>([]);
  heroMovie = signal<MovieSummary | null>(null);
  popularMovies = signal<MovieSummary[]>([]);
  recentMovies = signal<MovieSummary[]>([]);
  actionMovies = signal<MovieSummary[]>([]);

  ngOnInit(): void {
    this.fetchHomeData();
  }

  /**
   * Etapa 1: Busca os Gêneros.
   */
  private fetchHomeData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.movieService.getAllGenres().subscribe({
      next: (genresList) => {
        this.genres.set(genresList);
        
        // Se a busca de Gêneros for bem-sucedida, continua para a busca de Filmes
        this.fetchMovieLists(genresList);
      },
      error: (err) => {
        console.error('Erro ao carregar gêneros:', err);
        this.error.set('Não foi possível carregar o conteúdo (Erro ao buscar Gêneros).');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Etapa 2: Busca as listas de Filmes.
   */
  private fetchMovieLists(genresList: GenreSummary[]): void {
    
    // 1. Encontra o ID do gênero 'Ação'
    const actionGenre = genresList.find(g => g.name.toLowerCase() === 'ação');
    const actionGenreId = actionGenre?.id;

    // 2. Definição das chamadas (serão executadas em paralelo)
    const popularMovies$ = this.movieService.getMovies({ sort: 'Views desc', pageSize: 12 });
    const recentMovies$ = this.movieService.getMovies({ sort: 'ReleaseDate desc', pageSize: 12 });
    
    // Chamada de Ação: Se o actionGenreId for undefined/null, a propriedade 'genreId' não será enviada, 
    // prevenindo o erro 400.
    const actionMovies$ = this.movieService.getMovies({ 
      genreId: actionGenreId, 
      pageSize: 12 
    });


    // 3. Usa forkJoin para que as chamadas sejam feitas em paralelo
    forkJoin({
      popular: popularMovies$,
      recent: recentMovies$,
      action: actionMovies$,
    }).subscribe({
      next: (results) => {
        
        this.popularMovies.set(results.popular.items);
        this.recentMovies.set(results.recent.items);
        this.actionMovies.set(results.action.items);

        this.heroMovie.set(results.popular.items[0] || null);
        
        this.isLoading.set(false);
      },
      error: (err) => {
        // Note: Se o erro for aqui, geralmente é um 500 ou outro problema na API de Filmes
        console.error('Erro ao carregar as listas de filmes:', err);
        this.error.set('Não foi possível carregar o conteúdo dos filmes. (Erro no forkJoin)');
        this.isLoading.set(false);
      }
    });
  }
}