import { provideHttpClient, withInterceptors } from '@angular/common/http'; // <-- Importe isto
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Importe seu novo interceptor
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // -------------------------------------------------------------------
    // Adicione a função de provedor do HttpClient aqui
    // Isso resolve o "NullInjectorError: No provider for _HttpClient!"
    provideHttpClient(
      withInterceptors([
        authInterceptor // Adiciona o interceptor de JWT a todas as chamadas HTTP
      ])
    ),
    // -------------------------------------------------------------------
  ]
};