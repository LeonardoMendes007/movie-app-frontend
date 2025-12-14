import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard de Autenticação (JWT)
 * Garante que o usuário esteja logado (possui um token válido) para acessar a rota.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Verifica se existe um token de acesso no Local Storage
  const token = localStorage.getItem('access_token');

  if (token) {
    // 2. Se o token existe, verifica se o usuário está carregado no Signal
    // (A checagem de expiração do token deve ser feita pelo Interceptor ou no checkToken do AuthService,
    // mas aqui fazemos uma checagem simples de presença)
    
    // Se o Signal currentUser estiver preenchido, o usuário está ativo
    if (authService.currentUser() !== null) {
      return true; // Acesso permitido
    }

    // Se o Signal estiver nulo (ex: reload), tentamos recarregar o estado
    // Implementação ideal: chamar uma API de validação ou refresh token aqui.
    // Por enquanto, assumimos que se o token existe, ele é válido (lógica simplificada)
    // Se o token existe, permitimos e deixamos o Interceptor cuidar de erros 401.
    return true; 
  }

  // 3. Se não houver token, redireciona para a página de login
  router.navigate(['/auth/login']);
  return false;
};