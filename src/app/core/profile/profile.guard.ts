// src/app/core/profile/profile.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from '../services/profile.service'; // Ajuste o import

export const profileGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  // 1. Se já temos o perfil carregado em memória, passa direto
  if (profileService.currentProfile()) {
    return true;
  }

  // 2. Precisamos do ID do usuário logado.
  // Nota: Você precisará implementar a decodificação real do JWT no AuthService
  // para pegar o "sub" ou "uid" correto.
  const userId = authService.getProfileId(); 

  // 3. Tenta buscar o perfil na API
  return profileService.getProfile(userId).pipe(
    map(() => {
      // Sucesso (200 OK): Usuário tem perfil.
      return true;
    }),
    catchError((error) => {
      // Erro: Verifica se é 404 (ResourceNotFoundException do seu Middleware C#)
      if (error.status === 404) {
        // Redireciona para a tela de criação de perfil
        return of(router.createUrlTree(['/setup-profile']));
      }
      
      // Outros erros (500, sem internet, etc): Bloqueia ou manda pro login
      return of(router.createUrlTree(['/auth/login']));
    })
  );
};