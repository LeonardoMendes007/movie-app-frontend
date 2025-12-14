import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs'; // Import do tap e Signal
import { environment } from '../../../environments/environment';
import { ReplaceSpacesPipe } from '../../shared/pipes/replace-spaces.pipe'; // Novo import
import { GenreSummary, GetMoviesQueryParams, IPagedList, MovieSummary, MoviesApiResponse } from '../models/movie.models';

@Injectable({
  providedIn: 'root'
})
export class MovieAppService {
  private http = inject(HttpClient);
  // Instancia o pipe para uso interno (não é um provider)
  private replaceSpacesPipe = new ReplaceSpacesPipe(); 
  
  private readonly MOVIE_API_URL = `${environment.apiUrl}/api/movies`;
  private readonly GENRE_API_URL = `${environment.apiUrl}/api/genres`;

  // Signal para cache dos gêneros
  private genresCache = signal<GenreSummary[] | null>(null);
  // Getter público para o cache (apenas leitura)
  genres: Signal<GenreSummary[] | null> = this.genresCache.asReadonly();


  /**
   * Converte o objeto GetMoviesQueryParams para HttpParams para a requisição GET.
   */
  private createMovieParams(params: Partial<GetMoviesQueryParams>): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      const value = params[key as keyof GetMoviesQueryParams];
      
      // Igonora valores nulos/undefined/vazios para não quebrar a validação do Guid
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString()); 
      }
    });

    return httpParams;
  }

  /**
   * GET /api/movies - Busca uma lista paginada de filmes.
   */
  getMovies(params: Partial<GetMoviesQueryParams> = {}): Observable<IPagedList<MovieSummary>> {
    const httpParams = this.createMovieParams({
      page: 1, 
      pageSize: 30, // Aumentei o default para a página de gênero
      ...params
    });

    return this.http.get<MoviesApiResponse>(this.MOVIE_API_URL, { params: httpParams }).pipe(
      map(response => response.data)
    );
  }
  
  /**
   * GET /api/genres - Busca todos os gêneros (com cache).
   */
  getAllGenres(): Observable<GenreSummary[]> {
    const cachedGenres = this.genresCache();
    
    if (cachedGenres && cachedGenres.length > 0) {
      // Retorna um observable do valor em cache
      return new Observable<GenreSummary[]>(observer => {
        observer.next(cachedGenres);
        observer.complete();
      });
    }

    // Se não estiver em cache, faz a chamada e armazena o resultado
    return this.http.get<GenreSummary[]>(this.GENRE_API_URL).pipe(
      tap(genres => this.genresCache.set(genres)) // Armazena no Signal antes de retornar
    );
  }

  /**
   * Resolve o ID do Gênero a partir do nome da URL (slug).
   * @param slugName O nome do gênero formatado para URL (ex: 'ficcao-cientifica')
   * @returns O GenreSummary completo, ou null se não for encontrado.
   */
  getGenreBySlug(slugName: string): GenreSummary | null {
    const cachedGenres = this.genresCache();

    if (!cachedGenres) {
      return null;
    }

    // Busca o gênero onde o slug gerado bate com o slug da URL
    return cachedGenres.find(genre => 
      this.replaceSpacesPipe.transform(genre.name) === slugName
    ) || null;
  }
}