import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Interceptor de Autenticação JWT
 * 1. Adiciona o token JWT a todas as requisições (Bearer).
 * 2. Lida com erros de não autorizado (401), forçando o logout.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('access_token');

  let clonedRequest = req;

  // 1. Anexa o token de acesso à requisição, se ele existir
  if (token) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 2. Passa a requisição adiante e observa a resposta
  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // 3. Verifica se o erro é 401 (Unauthorized)
      if (error.status === 401) {
        
        // Aqui é onde você normalmente tentaria um Refresh Token
        // Se o Refresh Token falhar, ou se for um 401 após a tentativa de refresh:
        console.error('Erro 401: Token inválido ou expirado. Forçando logout.');
        authService.logout(); // Redireciona para o login e limpa o estado
        
        // Retorna um novo erro para o Observable que originou a chamada,
        // mas o usuário já foi redirecionado.
        return throwError(() => 'Sessão expirada. Faça login novamente.');
      }
      
      // Para outros erros (400, 500, etc.), apenas propaga
      return throwError(() => error);
    })
  );
};