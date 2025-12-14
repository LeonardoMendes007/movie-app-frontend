import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

// Services e Models
import { GenreSummary, MovieSummary } from '../../../core/models/movie.models';
import { MovieAppService } from '../../../core/services/movie-app.service';

// Componentes Compartilhados
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-movies-by-genre',
  standalone: true,
  imports: [
    CommonModule, 
    LoadingSpinnerComponent, 
    SectionTitleComponent,
    MovieCardComponent,
    RouterLink // Para o MovieCard
  ],
  templateUrl:  './movies-by-genre.component.html'
})
export class MoviesByGenreComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieAppService);

  // Estado da Página
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Dados
  genreSlug = signal(''); // O slug da URL
  currentGenre = signal<GenreSummary | null>(null);
  movies = signal<MovieSummary[]>([]);
  
  // Paginação
  currentPage = signal(1);
  pageSize = 30;
  totalCount = signal(0);
  hasMorePages = signal(false);


  ngOnInit(): void {
    // 1. Garante que os gêneros estejam carregados (do cache ou da API)
    this.movieService.getAllGenres().pipe(
      // 2. Combina o fluxo de gêneros com os parâmetros da rota
      switchMap(() => this.route.paramMap)
    ).subscribe((params: ParamMap) => {
      this.handleRouteParams(params);
    });
  }

  handleRouteParams(params: ParamMap): void {
    const slug = params.get('genreName') || '';
    this.genreSlug.set(slug);
    
    // 3. Resolve o gênero a partir do slug
    const genre = this.movieService.getGenreBySlug(slug);
    this.currentGenre.set(genre);

    // Reinicia a página e busca
    this.currentPage.set(1);
    this.fetchMovies();
  }
  
  changePage(newPage: number): void {
    if (newPage > 0 && (newPage <= Math.ceil(this.totalCount() / this.pageSize) || newPage < this.currentPage())) {
      this.currentPage.set(newPage);
      this.fetchMovies();
      // Scroll para o topo para melhor UX
      window.scrollTo(0, 0); 
    }
  }

  fetchMovies(): void {
    const genre = this.currentGenre();
    
    if (!genre) {
      this.movies.set([]);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Prepara os parâmetros para a API
    const params = {
      genreId: genre.id,
      page: this.currentPage(),
      pageSize: this.pageSize,
      sort: 'ReleaseDate desc' // Ou o que for mais relevante
    };
    
    this.movieService.getMovies(params).subscribe({
      next: (pagedList) => {
        this.movies.set(pagedList.items);
        this.totalCount.set(pagedList.totalCount);
        this.hasMorePages.set(pagedList.hasNextPage);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro na busca de filmes por gênero:', err);
        this.error.set('Não foi possível carregar os filmes. Verifique a API.');
        this.isLoading.set(false);
      }
    });
  }
}