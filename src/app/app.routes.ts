import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { profileGuard } from './core/profile/profile.guard';
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
        path: 'setup-profile',
        loadComponent: () => import('./features/setup-profile/setup-profile.component').then(m => m.SetupProfileComponent)
      },
      {
        path: 'home',
        canActivate: [profileGuard],
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'movies/genres/:genreName',
        canActivate: [profileGuard],
        loadComponent: () => import('./features/movies/movies-by-genre/movies-by-genre.component').then(m => m.MoviesByGenreComponent) // Você precisará criar este componente
      },
      {
        path: 'search/:term',
        canActivate: [profileGuard],
        loadComponent: () => import('./features/movies/search-results/search-results.component').then(m => m.SearchResultsComponent)
      },
      {
        path: 'movies/:id', // Rota para detalhes
        canActivate: [profileGuard],
        loadComponent: () => import('./features/movies/movie-details/movie-details.component').then(m => m.MovieDetailsComponent)
      },
      {
        path: 'favorites',
        canActivate: [profileGuard],
        loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'home' }
];