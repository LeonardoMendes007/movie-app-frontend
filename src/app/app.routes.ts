import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
// import { profileCheckGuard } from './core/profile/profile.guard'; // Adicionaremos este depois

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    // Rotas protegidas, que exigem login
    path: '',
    canActivate: [authGuard], // AQUI: Checa se o usuário está autenticado
    children: [
        {
            // Note: O profileCheckGuard irá garantir que ele passe pelo onboarding se precisar
            path: 'home',
            loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
        },
        { 
            path: 'movies/genres/:genreName', 
            loadComponent: () => import('./features/movies/movies-by-genre/movies-by-genre.component').then(m => m.MoviesByGenreComponent) // Você precisará criar este componente
        },
        { 
            path: 'search/:term', 
            loadComponent: () => import('./features/movies/search-results/search-results.component').then(m => m.SearchResultsComponent)
        },
        
    ]
  },
  { path: '**', redirectTo: 'home' }
];