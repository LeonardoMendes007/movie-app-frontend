import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, RegisterRequest, TokenResponse, User } from './models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // URL base da API (ajuste conforme seu environment)
  private readonly API_URL = `${environment.apiUrl}/api/auth`; 

  // Signals para gerenciar estado reativo
  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);

  constructor() { 
    this.checkToken();
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    this.isLoading.set(true);
    return this.http.post<ApiResponse<TokenResponse>>(`${this.API_URL}/login`, credentials)
      .pipe(
        map(response => response.data), // Extrai o TokenResponse de dentro do ResponseBase
        tap(tokenData => this.handleAuthSuccess(tokenData, credentials.email)),
        catchError(err => this.handleError(err)),
        tap(() => this.isLoading.set(false)) // Finaliza loading
      );
  }

  register(data: RegisterRequest): Observable<TokenResponse> {
    this.isLoading.set(true);
    return this.http.post<ApiResponse<TokenResponse>>(`${this.API_URL}/register`, data)
      .pipe(
        map(response => response.data),
        tap(tokenData => this.handleAuthSuccess(tokenData, data.email, data.userName)),
        catchError(err => this.handleError(err)),
        tap(() => this.isLoading.set(false))
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // Lógica privada auxiliar
  private handleAuthSuccess(response: TokenResponse, email: string, name?: string) {
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    
    this.currentUser.set({ email, name });
    
    // Redireciona para o guard verificar o profile
    this.router.navigate(['/home']); 
  }

  private handleError(error: HttpErrorResponse) {
    this.isLoading.set(false);
    let errorMessage = 'Ocorreu um erro inesperado.';

    // Tratamento específico baseado no seu ResponseError
    if (error.error) {
      if (error.error.errors && Array.isArray(error.error.errors)) {
         // Caso do Register (Lista de erros)
         errorMessage = error.error.errors.join('<br>'); 
      } else if (error.error.message) {
         // Caso do Login (Mensagem simples)
         errorMessage = error.error.message;
      }
    }
    return throwError(() => errorMessage);
  }

  getProfileId(): string {
    return this.currentUser()?.id || ""; 
  }

  private checkToken() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
  
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      
      const id =
        decodedPayload[
          'Id'
        ];

      const email =
        decodedPayload[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        ];
  
      if (email) {
        this.currentUser.set({ id, email });
      }
    } catch (error) {
      console.error('Invalid JWT token', error);
    }
  }
}