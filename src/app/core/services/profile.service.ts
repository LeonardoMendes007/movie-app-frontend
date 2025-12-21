// src/app/core/services/profile.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IPagedList, MovieSummary, MoviesApiResponse } from '../models/movie.models';
import { CreateProfileRequest, ProfileApiResponse, ProfileSummary } from '../models/profile.models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/api/profiles`;

  // Signal para manter o estado do perfil atual na sessão
  currentProfile = signal<ProfileSummary | null>(null);

  /**
   * Tenta buscar o perfil pelo ID (que deve ser o mesmo do User ID do Auth).
   * Retorna 404 se não existir (tratado no Guard).
   */
  getProfile(id: string): Observable<ProfileSummary> {
    return this.http.get<ProfileApiResponse>(`${this.API_URL}`).pipe(
      map(response => response.data),
      tap(profile => this.currentProfile.set(profile))
    );
  }

  /**
   * Cria o perfil. O ID deve ser passado explicitamente (vem do Auth).
   */
  createProfile(request: CreateProfileRequest): Observable<string> {
    return this.http.post<any>(this.API_URL, request).pipe(
      // O seu controller retorna CreatedAtAction com ResponseBase.
      // Dependendo de como o CreatedAtAction serializa, pode vir o ID ou o objeto completo.
      // No seu código C# retorna: new { id = id } dentro do CreatedAtAction
      map(response => response.id || request.id),
      tap(() => {
        // Após criar, já definimos o estado local para evitar refetch imediato
        this.currentProfile.set({
          id: request.id,
          userName: request.userName,
          imageUrl: request.imageUrl || '',
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString()
        });
      })
    );
  }

  /**
   * Adiciona um filme aos favoritos do perfil
   */
  addFavorite(profileId: string, movieId: string): Observable<void> {
    // O endpoint é POST api/profiles/{id}/favorites
    // O body esperado é RegisterFavoriteMovieRequest { movieId: Guid }
    return this.http.post<void>(`${this.API_URL}/favorites`, {
      movieId: movieId
    });
  }

  /**
 * BUSCA A LISTA COMPLETA DE FAVORITOS (Para a nova tela /favorites)
 */
  getFavorites(profileId: string, page: number = 1, pageSize: number = 20): Observable<IPagedList<MovieSummary>> {
    // O endpoint GET api/profiles/{id}/favorites (do ProfileController)
    return this.http.get<MoviesApiResponse>(`${this.API_URL}/favorites`, {
      params: { page, pageSize } as any
    }).pipe(
      map(response => response.data as IPagedList<MovieSummary>)
    );
  }

  /**
   * MÉTODO OTIMIZADO: Busca apenas os IDs para checagem rápida (Usado no MovieDetailsComponent)
   */
  getFavoriteMovieIds(profileId: string): Observable<string[]> {
    // Busca a primeira página (ex: 100 itens) para checagem rápida no MovieDetails
    return this.getFavorites(profileId, 1, 100).pipe(
      map(pagedList => pagedList.items.map(movie => movie.id))
    );
  }

  /**
   * Remove um filme dos favoritos do perfil (Assunção REST)
   * Se a sua API usa um verbo HTTP diferente ou outro path, ajuste aqui.
   */
  removeFavorite(profileId: string, movieId: string): Observable<void> {
    // DELETE api/profiles/{id}/favorites/{movieId}
    return this.http.delete<void>(`${this.API_URL}/favorites/${movieId}`);
  }
}