import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

// Services e Models
import { MovieSummary } from '../../../core/models/movie.models';
import { MovieAppService } from '../../../core/services/movie-app.service';

// Componentes Compartilhados
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule, 
    LoadingSpinnerComponent, 
    SectionTitleComponent,
    MovieCardComponent,
    RouterLink
  ],
  templateUrl: './search-results.component.html'   
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieAppService);

  // Estado da Página
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Dados
  currentSearchTerm = signal(''); 
  movies = signal<MovieSummary[]>([]);
  
  // Paginação
  currentPage = signal(1);
  pageSize = 30;
  totalCount = signal(0);
  hasMorePages = signal(false);


  ngOnInit(): void {
    // Monitora as mudanças no parâmetro 'term' da URL
    this.route.paramMap.pipe(
      // Sempre que o termo mudar na URL, reinicia a busca
      switchMap((params: ParamMap) => {
        const term = params.get('term') || '';
        this.currentSearchTerm.set(term);
        
        if (!term) {
            // Não faz nada se o termo estiver vazio
            this.movies.set([]);
            this.isLoading.set(false);
            return [];
        }

        // Reinicia a paginação e prepara a chamada à API
        this.currentPage.set(1);
        this.isLoading.set(true);
        this.error.set(null);

        return this.movieService.getMovies({
          searchTerm: term,
          page: this.currentPage(),
          pageSize: this.pageSize,
          sort: 'ReleaseDate desc' // Ordenação padrão para resultados
        });
      })
    ).subscribe({
      next: (pagedList) => {
        // O switchMap garante que pagedList é o resultado do último Observable emitido.
        this.movies.set(pagedList.items);
        this.totalCount.set(pagedList.totalCount);
        this.hasMorePages.set(pagedList.hasNextPage);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro na busca de filmes por termo:', err);
        this.error.set('Não foi possível carregar os resultados da busca.');
        this.isLoading.set(false);
      }
    });
  }

  changePage(newPage: number): void {
    const totalPages = Math.ceil(this.totalCount() / this.pageSize);

    if (newPage >= 1 && newPage <= totalPages) {
      this.currentPage.set(newPage);
      this.fetchMoviesForPage(newPage);
      window.scrollTo(0, 0); 
    }
  }

  fetchMoviesForPage(page: number): void {
    const term = this.currentSearchTerm();
    if (!term) return;

    this.isLoading.set(true);
    this.error.set(null);

    const params = {
      searchTerm: term,
      page: page,
      pageSize: this.pageSize,
      sort: 'ReleaseDate desc'
    };
    
    this.movieService.getMovies(params).subscribe({
      next: (pagedList) => {
        this.movies.set(pagedList.items);
        this.totalCount.set(pagedList.totalCount);
        this.hasMorePages.set(pagedList.hasNextPage);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar a página de resultados.');
        this.isLoading.set(false);
      }
    });
  }
}