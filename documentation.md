# Documentação de Código da Aplicação MovieApp.FrontEnd

## src/app/app.component.ts

Este arquivo define o componente raiz da aplicação Angular.

```typescript
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Componentes Reutilizáveis (serão criados futuramente em src/app/shared/)
// Como o Navbar é global e a maior parte da app é protegida, ele fica aqui.
import { AuthService } from './core/auth/auth.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    // Importamos o Navbar aqui para ele aparecer em todas as rotas filhas
    NavbarComponent,
  ],
  template: `
    <app-navbar *ngIf="shouldShowNavbar()"></app-navbar>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private authService = inject(AuthService);

  // Lógica simples para determinar se o Navbar deve ser exibido.
  // Se o usuário estiver logado, mostramos.
  // Em apps mais complexas, você usaria o Router para verificar a URL atual
  // e esconder em rotas específicas (ex: /auth/login, /auth/register).
  shouldShowNavbar(): boolean {
    return this.authService.currentUser() !== null;
  }
}
```

**Descrição Detalhada:**

*   **`@Component` Decorator**:
    *   `selector: 'app-root'`: Define o seletor HTML para este componente. Onde `app-root` for usado no HTML, este componente será renderizado.
    *   `standalone: true`: Indica que este é um componente *standalone*, que não precisa ser declarado em um `NgModule`.
    *   `imports`: Lista os módulos e componentes que este componente usa.
        *   `CommonModule`: Fornece diretivas como `*ngIf`, `*ngFor`.
        *   `RouterOutlet`: Um placeholder onde o Angular injeta componentes roteados.
        *   `NavbarComponent`: O componente de navegação global da aplicação, que é importado para ser exibido em todas as rotas filhas.
    *   `template`: Contém o template HTML inline do componente.
        *   `<app-navbar *ngIf="shouldShowNavbar()"></app-navbar>`: Renderiza o `NavbarComponent` condicionalmente, apenas se a função `shouldShowNavbar()` retornar `true`.
        *   `<main><router-outlet></router-outlet></main>`: Define a área principal onde os componentes das rotas serão carregados.
    *   `styleUrls: ['./app.component.scss']`: Aponta para o arquivo de estilos SCSS específico deste componente.
*   **`AppComponent` Class**:
    *   `private authService = inject(AuthService)`: Injeta o `AuthService` usando a função `inject` (disponível com o Angular 14+), tornando-o acessível como uma propriedade privada da classe.
    *   `shouldShowNavbar(): boolean`: Um método que retorna `true` se o usuário atual (`currentUser()`) no `AuthService` não for nulo (ou seja, se o usuário estiver logado). Esta lógica determina se a barra de navegação deve ser exibida.

## src/app/app.config.ts

Este arquivo configura o aplicativo Angular, incluindo roteamento e provedores HTTP.

```typescript
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
```

**Descrição Detalhada:**

*   **`appConfig: ApplicationConfig`**: Exporta uma constante `appConfig` do tipo `ApplicationConfig`, que é o objeto de configuração principal para o aplicativo Angular.
*   **`providers` Array**:
    *   `provideRouter(routes)`: Configura o roteador da aplicação usando as rotas definidas em `app.routes.ts`.
    *   `provideHttpClient(...)`: Configura o cliente HTTP da aplicação.
        *   `withInterceptors([authInterceptor])`: Adiciona uma lista de interceptores HTTP. Neste caso, o `authInterceptor` é incluído para interceptar todas as requisições HTTP e adicionar um token JWT (JSON Web Token) para autenticação.

## src/app/app.routes.ts

Este arquivo define as rotas principais da aplicação Angular.

```typescript
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
```

**Descrição Detalhada:**

*   **`routes: Routes`**: Exporta uma constante `routes` do tipo `Routes` (uma array de objetos de rota), que define a estrutura de navegação da aplicação.
*   **Primeira Rota (`path: ''`)**:
    *   `path: ''`: Define a rota padrão (raiz).
    *   `redirectTo: 'home'`: Redireciona a rota raiz para `/home`.
    *   `pathMatch: 'full'`: Garante que o redirecionamento ocorra apenas quando o caminho inteiro corresponder à string vazia.
*   **Rota de Autenticação (`path: 'auth'`)**:
    *   `path: 'auth'`: Define a rota para funcionalidades de autenticação.
    *   `loadChildren: () => import(...)`: Utiliza *lazy loading* para carregar as rotas de autenticação (`AUTH_ROUTES`) do módulo `auth.routes` apenas quando esta rota for acessada. Isso otimiza o tempo de carregamento inicial da aplicação.
*   **Rotas Protegidas (`path: ''`, `canActivate: [authGuard]`)**:
    *   `path: ''`: Define um grupo de rotas que compartilham o mesmo `canActivate` guard.
    *   `canActivate: [authGuard]`: Aplica o `authGuard` a todas as rotas filhas. O `authGuard` é responsável por verificar se o usuário está autenticado antes de permitir o acesso a essas rotas. Se o usuário não estiver logado, ele será redirecionado para a página de login.
    *   `children`: Contém as rotas filhas que são protegidas pelo `authGuard`.
        *   `path: 'home'`, `loadComponent: () => import(...)`: Carrega o `HomeComponent` de forma lazy.
        *   `path: 'movies/genres/:genreName'`, `loadComponent: () => import(...)`: Rota para exibir filmes por gênero, com um parâmetro de rota `genreName`.
        *   `path: 'search/:term'`, `loadComponent: () => import(...)`: Rota para exibir resultados de busca, com um parâmetro de rota `term`.
*   **Rota Coringa (`path: '**'`)**:
    *   `path: '**'`: Captura qualquer rota que não corresponda às rotas definidas anteriormente.
    *   `redirectTo: 'home'`: Redireciona rotas inválidas para a página inicial.

## src/app/core/auth/auth.guard.ts

Este arquivo define o `authGuard` do Angular, responsável por proteger rotas e garantir que apenas usuários autenticados possam acessá-las.

```typescript
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
```

**Descrição Detalhada:**

*   **`authGuard: CanActivateFn`**: Define um *functional guard* para rotas.
*   **Injeção de Dependências**:
    *   `const authService = inject(AuthService)`: Injeta o serviço `AuthService` para acessar o estado de autenticação.
    *   `const router = inject(Router)`: Injeta o `Router` para possibilitar redirecionamentos.
*   **Lógica do Guard**:
    1.  **Verificação de Token**: O guard tenta obter o `access_token` do `localStorage`.
    2.  **Token Existente**: Se um token for encontrado:
        *   Verifica se o `currentUser` no `AuthService` não é nulo. Se for, significa que o usuário está logado e o acesso à rota é permitido (`return true`).
        *   Se o `currentUser` for nulo (o que pode acontecer após um *refresh* da página, por exemplo), o guard ainda permite o acesso (`return true`). A lógica aqui assume que o `authInterceptor` lidará com tokens expirados ou inválidos (retornando 401 do backend), forçando o logout. Esta é uma simplificação e, em uma aplicação real, poderia envolver uma validação mais robusta do token ou uma tentativa de *refresh*.
    3.  **Token Não Existente**: Se nenhum token for encontrado no `localStorage`, o usuário não está autenticado. O guard redireciona o usuário para a página de login (`/auth/login`) e impede o acesso à rota (`return false`).

## src/app/core/auth/auth.interceptor.ts

Este arquivo define o `authInterceptor` do Angular, que atua em todas as requisições HTTP para adicionar o token JWT e tratar erros de autenticação (status 401).

```typescript
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Interceptor de Autenticação JWT
 * 1. Adiciona o token JWT a todas as requisições (Bearer).\
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
```

**Descrição Detalhada:**

*   **`authInterceptor: HttpInterceptorFn`**: Define um *functional HTTP interceptor*.
*   **Injeção de Dependências**:
    *   `const authService = inject(AuthService)`: Injeta o `AuthService` para acessar as funcionalidades de logout.
*   **Lógica do Interceptor**:
    1.  **Obtenção do Token**: O interceptor tenta obter o `access_token` do `localStorage`.
    2.  **Clonagem da Requisição**: Uma nova requisição (`clonedRequest`) é criada a partir da requisição original (`req`). Isso é necessário porque as requisições são imutáveis no Angular.
    3.  **Adição do Token**: Se um token for encontrado, um cabeçalho `Authorization` com o formato `Bearer <token>` é adicionado à `clonedRequest`.
    4.  **Processamento da Requisição**: A `clonedRequest` é passada para o próximo handler (`next(clonedRequest)`), que a envia para o servidor. O `pipe(catchError(...))` é usado para interceptar quaisquer erros na resposta.
    5.  **Tratamento de Erro 401**:
        *   Se a resposta for um `HttpErrorResponse` com `status === 401` (Unauthorized), significa que o token é inválido ou expirou.
        *   O `console.error` registra o erro.
        *   `authService.logout()` é chamado para limpar o estado de autenticação (remover tokens do `localStorage`) e redirecionar o usuário para a página de login.
        *   `throwError` é usado para propagar um novo erro no `Observable`, que pode ser tratado pelos subscritores da requisição original, embora o usuário já tenha sido redirecionado.
    6.  **Outros Erros**: Para qualquer outro tipo de erro HTTP (ex: 400 Bad Request, 500 Internal Server Error), o erro é simplesmente propagado (`throwError(() => error)`) para que seja tratado no local onde a requisição foi feita.

## src/app/core/auth/auth.service.ts

Este serviço é responsável por todas as operações relacionadas à autenticação de usuários, incluindo login, registro, logout, gerenciamento de tokens e estado do usuário.

```typescript
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
    // TODO: Implement proper fetching of profile ID from JWT token or user profile API
    // For now, returning a dummy ID.
    return '3fa85f64-5717-4562-b3fc-2c963f66afa6'; // Example GUID
  }

  private checkToken() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));

      const email =
        decodedPayload[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        ];

      if (email) {
        this.currentUser.set({ email });
      }
    } catch (error) {
      console.error('Invalid JWT token', error);
    }
  }
}
```

**Descrição Detalhada:**

*   **`@Injectable({ providedIn: 'root' })`**: Marca a classe como um serviço que pode ser injetado em qualquer lugar na aplicação e garante que uma única instância seja fornecida em toda a aplicação.
*   **Injeção de Dependências**:
    *   `private http = inject(HttpClient)`: Injeta o `HttpClient` para fazer requisições HTTP.
    *   `private router = inject(Router)`: Injeta o `Router` para navegação programática.
*   **Propriedades**:
    *   `private readonly API_URL`: Constrói a URL base para as APIs de autenticação usando `environment.apiUrl`.
    *   `currentUser = signal<User | null>(null)`: Um *signal* que armazena o usuário logado atualmente, ou `null` se ninguém estiver logado. Signals são uma forma reativa de gerenciar estado no Angular.
    *   `isLoading = signal<boolean>(false)`: Um *signal* que indica se uma operação de autenticação (login/registro) está em andamento.
*   **`constructor()`**:
    *   Chama `this.checkToken()` ao inicializar o serviço para tentar carregar o usuário se houver um token válido no `localStorage`.
*   **`login(credentials: LoginRequest): Observable<TokenResponse>`**:
    *   Método para autenticar um usuário.
    *   Define `isLoading` para `true` no início.
    *   Faz uma requisição POST para o endpoint `/login` da API com as credenciais fornecidas.
    *   `pipe()`: Encapsula uma sequência de operadores RxJS:
        *   `map(response => response.data)`: Extrai o TokenResponse de dentro do ResponseBase
        *   `tap(tokenData => this.handleAuthSuccess(tokenData, credentials.email))`: Chama `handleAuthSuccess` em caso de sucesso, armazenando os tokens e definindo o `currentUser`.
        *   `catchError(err => this.handleError(err))`: Captura erros e os trata com `handleError`.
        *   `tap(() => this.isLoading.set(false))`: Define `isLoading` para `false` no final (seja sucesso ou erro).
*   **`register(data: RegisterRequest): Observable<TokenResponse>`**:
    *   Método para registrar um novo usuário, com lógica similar ao `login`.
    *   Faz uma requisição POST para o endpoint `/register`.
    *   Chama `handleAuthSuccess` com o `email` e `userName` do registro.
*   **`logout()`**:
    *   Remove `access_token` e `refresh_token` do `localStorage`.
    *   Define `currentUser` para `null`.
    *   Redireciona o usuário para a página de login (`/auth/login`).
*   **`private handleAuthSuccess(response: TokenResponse, email: string, name?: string)`**:
    *   Método auxiliar privado para lidar com o sucesso do login/registro.
    *   Armazena o `accessToken` e `refreshToken` no `localStorage`.
    *   Define o `currentUser` com o `email` e `name` fornecidos.
    *   Redireciona para a página `/home`.
*   **`private handleError(error: HttpErrorResponse)`**:
    *   Método auxiliar privado para tratar erros de requisições HTTP.
    *   Define `isLoading` para `false`.
    *   Extrai uma mensagem de erro apropriada da `HttpErrorResponse`, considerando diferentes formatos de erro (lista de erros para registro, mensagem simples para login).
    *   Retorna um `throwError` com a mensagem de erro para que os componentes possam lidar com ela.
*   **`getProfileId(): string`**:
    *   Um método `TODO` que atualmente retorna um GUID de exemplo. A implementação futura deve extrair o ID do perfil do token JWT ou de uma API de perfil de usuário.
*   **`private checkToken()`**:
    *   Método auxiliar privado chamado no `constructor` para verificar se existe um `access_token` no `localStorage`.
    *   Se um token for encontrado, ele tenta decodificá-lo (assumindo que seja um JWT) para extrair o `email` do usuário.
    *   Se o `email` for extraído com sucesso, o `currentUser` é definido com este email, restaurando o estado de autenticação após um *refresh* da página.
    *   Inclui um bloco `try-catch` para lidar com tokens JWT inválidos.

## src/app/core/auth/models/auth.models.ts

Este arquivo define as interfaces de modelos de dados relacionadas à autenticação e autorização na aplicação.

```typescript
export interface TokenResponse {
    authenticated: boolean;
    expiration: string;
    accessToken: string;
    refreshToken: string;
  }

  export interface LoginRequest {
    email: string;
    password: string;
  }

  export interface RegisterRequest {
    userName: string; // Importante: No C# está UserName
    email: string;
    password: string;
  }

  export interface User {
    email: string;
    name?: string;
  }
```

**Descrição Detalhada:**

*   **`TokenResponse`**: Interface que representa a estrutura da resposta de um endpoint de autenticação bem-sucedida, contendo informações sobre o token JWT.
    *   `authenticated: boolean`: Indica se a autenticação foi bem-sucedida.
    *   `expiration: string`: A data e hora de expiração do token de acesso.
    *   `accessToken: string`: O token JWT de acesso.
    *   `refreshToken: string`: O token de atualização, usado para obter novos tokens de acesso sem a necessidade de reautenticar.
*   **`LoginRequest`**: Interface que define a estrutura dos dados esperados para uma requisição de login.
    *   `email: string`: O email do usuário para login.
    *   `password: string`: A senha do usuário para login.
*   **`RegisterRequest`**: Interface que define a estrutura dos dados esperados para uma requisição de registro de novo usuário.
    *   `userName: string`: O nome de usuário (importante: corresponde a `UserName` no backend C#).
    *   `email: string`: O email do novo usuário.
    *   `password: string`: A senha do novo usuário.
*   **`User`**: Interface que representa um objeto de usuário simplificado, usado para armazenar informações básicas do usuário autenticado no frontend.
    *   `email: string`: O email do usuário.
    *   `name?: string`: O nome do usuário (opcional).

## src/app/core/auth/models/user.model.ts

Este arquivo define a interface `User`. **Nota: Esta interface é uma duplicação da interface `User` já definida em `src/app/core/auth/models/auth.models.ts`. É recomendável remover esta duplicação e usar a definição existente para manter a consistência do código.**

```typescript
export interface User {
    email: string;
    name?: string;
  }
```

**Descrição Detalhada:**

*   **`User`**: Interface que representa um objeto de usuário simplificado, usado para armazenar informações básicas do usuário autenticado no frontend.
    *   `email: string`: O email do usuário.
    *   `name?: string`: O nome do usuário (opcional).

## src/app/core/models/api-response.model.ts

Este arquivo define as interfaces genéricas para respostas e erros de API, espelhando a estrutura do backend C#.

```typescript
import { HttpStatusCode } from "@angular/common/http";

// Espelho do ResponseBase<T> do C#
export interface ApiResponse<T> {
  data: T;
  statusCode: HttpStatusCode;
  message?: string;
}

// Espelho do ResponseError<T> do C# (onde T geralmente é string[])
export interface ApiErrorResponse<T = string[]> {
  errors: T;
  statusCode: HttpStatusCode;
  message?: string;
}
```

**Descrição Detalhada:**

*   **`ApiResponse<T>`**: Interface genérica que representa uma resposta bem-sucedida de API.
    *   `data: T`: Contém os dados retornados pela API. `T` é um tipo genérico que pode ser qualquer estrutura de dados esperada.
    *   `statusCode: HttpStatusCode`: O código de status HTTP da resposta.
    *   `message?: string`: Uma mensagem opcional da API.
*   **`ApiErrorResponse<T = string[]>`**: Interface genérica que representa uma resposta de erro de API.
    *   `errors: T`: Contém os erros retornados pela API. Por padrão, `T` é um array de strings (`string[]`), mas pode ser qualquer tipo de erro específico.
    *   `statusCode: HttpStatusCode`: O código de status HTTP do erro.
    *   `message?: string`: Uma mensagem opcional de erro da API.

## src/app/core/models/movie.models.ts

Este arquivo define as interfaces de modelos de dados relacionadas a filmes, gêneros e paginação.

```typescript
import { ApiResponse } from './api-response.model'; // A interface ApiResponse<T> que já criamos

// --- Query Params ---
export interface PagedListQueryParams {
    page: number; //
    pageSize: number; //
    // O backend tem um default de Page=1 e PageSize=30
}

export interface GetMoviesQueryParams extends PagedListQueryParams {
    genreId?: string; // Guid no C#, aqui usamos string
    searchTerm?: string; //
    releaseYear?: number; //
    sort?: string; // Usaremos 'views' ou 'releaseDate', separados por vírgula no C#
}

// --- Summaries ---
export interface GenreSummary {
    id: string; // Guid
    name: string; //
}

export interface MovieSummary {
    id: string; // Guid
    name: string; //
    synopsis: string; //
    imageUrl: string; //
    releaseDate: string; // DateTime no C#, aqui string
    views: number; //
}

// --- Paged List Response ---
export interface IPagedList<T> {
    items: T[]; // List<T>
    page: number; //
    pageSize: number; //
    totalCount: number; //
    hasNextPage: boolean; //
    hasPreviusPage: boolean; // Note: 'Previus' no C#
}

// Tipo de resposta final para /api/movies
export type MoviesApiResponse = ApiResponse<IPagedList<MovieSummary>>;

// Tipo de resposta final para /api/genres
// O GenresController não usa o ResponseBase<T> no retorno (aparentemente retorna a lista pura ou outro formato),
// Mas, para manter a consistência, vamos assumir que ele retorna ResponseBase<GenreSummary[]> ou ResponseBase<IPagedList<GenreSummary>> se tiver paginação.
// Pelo GenresController.cs, a função é Ok(await _genreFacade.GetAllGenresAsync()), vamos assumir que retorna um array.
export type GenresApiResponse = ApiResponse<GenreSummary[]>;
```

**Descrição Detalhada:**

*   **`PagedListQueryParams`**: Interface que define os parâmetros básicos para requisições de listas paginadas.
    *   `page: number`: O número da página solicitada.
    *   `pageSize: number`: O tamanho da página (número de itens por página).
*   **`GetMoviesQueryParams`**: Interface que estende `PagedListQueryParams` e adiciona parâmetros específicos para filtrar e ordenar filmes.
    *   `genreId?: string`: O ID do gênero para filtrar (opcional). No backend C#, é um GUID, mas no frontend é tratado como string.
    *   `searchTerm?: string`: Um termo de busca para filtrar filmes (opcional).
    *   `releaseYear?: number`: O ano de lançamento para filtrar filmes (opcional).
    *   `sort?: string`: Uma string que especifica a ordem de classificação (ex: `'views'` ou `'releaseDate'`).
*   **`GenreSummary`**: Interface que representa um resumo de informações de um gênero de filme.
    *   `id: string`: O ID do gênero (GUID no C#).
    *   `name: string`: O nome do gênero.
*   **`MovieSummary`**: Interface que representa um resumo de informações de um filme.
    *   `id: string`: O ID do filme (GUID).
    *   `name: string`: O título do filme.
    *   `synopsis: string`: A sinopse do filme.
    *   `imageUrl: string`: A URL da imagem de capa do filme.
    *   `releaseDate: string`: A data de lançamento do filme (DateTime no C#, string aqui).
    *   `views: number`: O número de visualizações do filme.
*   **`IPagedList<T>`**: Interface genérica que representa uma lista paginada de itens.
    *   `items: T[]`: Um array dos itens da página atual.
    *   `page: number`: O número da página atual.
    *   `pageSize: number`: O tamanho da página.
    *   `totalCount: number`: O número total de itens disponíveis.
    *   `hasNextPage: boolean`: Indica se há uma próxima página.
    *   `hasPreviusPage: boolean`: Indica se há uma página anterior (nota: `Previus` é um erro de digitação do backend, deve ser `Previous`).
*   **`MoviesApiResponse`**: Tipo que define a resposta esperada para a API de filmes paginados, encapsulada em `ApiResponse<IPagedList<MovieSummary>>`.
*   **`GenresApiResponse`**: Tipo que define a resposta esperada para a API de gêneros, encapsulada em `ApiResponse<GenreSummary[]>`. Assume que a API de gêneros retorna um array de `GenreSummary`.

## src/app/core/models/profile.models.ts

Este arquivo está vazio. Provavelmente, destina-se a conter interfaces de modelos de dados relacionadas a perfis de usuário no futuro.

```typescript

```

**Descrição Detalhada:**

Este arquivo não contém nenhuma declaração de código no momento.

## src/app/core/services/movie-app.service.ts

Este serviço é responsável por interagir com as APIs de filmes e gêneros, fornecendo métodos para buscar filmes paginados e todos os gêneros, com funcionalidade de cache para os gêneros.

```typescript
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
   * Converte o objeto GetMoviesQueryParams para HttpParams para a requisição GET.\
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
   * GET /api/movies - Busca uma lista paginada de filmes.\
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
   * GET /api/genres - Busca todos os gêneros (com cache).\
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
   * Resolve o ID do Gênero a partir do nome da URL (slug).\
   * @param slugName O nome do gênero formatado para URL (ex: 'ficcao-cientifica')
   * @returns O GenreSummary completo, ou null se não for encontrado.\
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
```

**Descrição Detalhada:**

*   **`@Injectable({ providedIn: 'root' })`**: Marca a classe como um serviço que pode ser injetado em qualquer lugar da aplicação e garante que uma única instância seja fornecida.
*   **Injeção de Dependências**:
    *   `private http = inject(HttpClient)`: Injeta o `HttpClient` para fazer requisições HTTP.
    *   `private replaceSpacesPipe = new ReplaceSpacesPipe()`: Instancia o `ReplaceSpacesPipe` para uso interno.
*   **Propriedades**:
    *   `private readonly MOVIE_API_URL`: URL base para a API de filmes.
    *   `private readonly GENRE_API_URL`: URL base para a API de gêneros.
    *   `private genresCache = signal<GenreSummary[] | null>(null)`: Um *signal* privado para armazenar em cache a lista de gêneros.
    *   `genres: Signal<GenreSummary[] | null> = this.genresCache.asReadonly()`: Um *getter* público e *readonly* para o cache de gêneros.
*   **`private createMovieParams(params: Partial<GetMoviesQueryParams>): HttpParams`**:
    *   Método auxiliar privado para converter um objeto de parâmetros de consulta (`GetMoviesQueryParams`) em um objeto `HttpParams`, que é utilizado em requisições GET.
    *   Itera sobre as chaves do objeto `params` e adiciona-as aos `HttpParams`, ignorando valores `undefined`, `null` ou vazios.
*   **`getMovies(params: Partial<GetMoviesQueryParams> = {}): Observable<IPagedList<MovieSummary>>`**:
    *   Método para buscar uma lista paginada de filmes.
    *   Cria `HttpParams` usando `createMovieParams`, aplicando valores padrão para `page` e `pageSize`, e mesclando com os parâmetros fornecidos.
    *   Faz uma requisição GET para `MOVIE_API_URL`.
    *   Usa `pipe(map(response => response.data))` para extrair os dados de paginação da `ApiResponse`.
*   **`getAllGenres(): Observable<GenreSummary[]>`**:
    *   Método para buscar todos os gêneros, utilizando um mecanismo de cache.
    *   **Cache Hit**: Se `genresCache` já contiver dados, retorna um `Observable` que emite imediatamente os dados em cache.
    *   **Cache Miss**: Se não houver dados em cache, faz uma requisição GET para `GENRE_API_URL`.
    *   `pipe(tap(genres => this.genresCache.set(genres)))`: Após receber os gêneros da API, armazena-os no `genresCache` antes de emiti-los.
*   **`getGenreBySlug(slugName: string): GenreSummary | null`**:
    *   Método para encontrar um gênero no cache a partir de seu "slug" (nome formatado para URL).
    *   Verifica se o `genresCache` está preenchido.
    *   Percorre os gêneros em cache e usa `replaceSpacesPipe.transform(genre.name)` para comparar o nome do gênero com o `slugName` fornecido.
    *   Retorna o `GenreSummary` correspondente ou `null` se não for encontrado.

## src/app/core/services/profile.service.ts

Este arquivo está vazio. Provavelmente, destina-se a conter um serviço para interagir com a API de perfil de usuário no futuro.

```typescript

```

**Descrição Detalhada:**

Este arquivo não contém nenhuma declaração de código no momento.

## src/app/features/auth/auth.routes.ts

Este arquivo define as rotas específicas para as funcionalidades de autenticação (login e registro) da aplicação.

```typescript
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
```

**Descrição Detalhada:**

*   **`AUTH_ROUTES: Routes`**: Exporta uma constante `AUTH_ROUTES` do tipo `Routes`, contendo as rotas para o módulo de autenticação.
    *   `{ path: 'login', component: LoginComponent }`: Mapeia a URL `/auth/login` para o `LoginComponent`.
    *   `{ path: 'register', component: RegisterComponent }`: Mapeia a URL `/auth/register` para o `RegisterComponent`.
    *   `{ path: '', redirectTo: 'login', pathMatch: 'full' }`: Define um redirecionamento. Se a URL base do módulo de autenticação for acessada sem um caminho específico (ex: `/auth`), ela será redirecionada para `/auth/login`.

## src/app/features/auth/login/login.component.html

Este é o template HTML do componente `LoginComponent`, que fornece a interface de usuário para o formulário de login.

```html
<div class="min-h-screen flex items-center justify-center bg-dark-900 px-4">
    <div class="max-w-md w-full bg-dark-800 rounded-xl shadow-2xl p-8 border border-dark-700">

        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h2>
            <p class="text-gray-400">Entre para continuar assistindo</p>
        </div>

        <div *ngIf="errorMessage()"
            class="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
            {{ errorMessage() }}
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">

            <div>
                <label for="email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input id="email" type="email" formControlName="email"
                    class="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="seu@email.com">
            </div>

            <div>
                <label for="password" class="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                <input id="password" type="password" formControlName="password"
                    class="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="••••••••">
            </div>

            <button type="submit" [disabled]="loginForm.invalid || authService.isLoading()"
                class="w-full bg-primary hover:bg-cyan-400 text-dark-900 font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="authService.isLoading()">Entrando...</span>
                <span *ngIf="!authService.isLoading()">Entrar</span>
            </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-400">
            Não tem uma conta?
            <a routerLink="/auth/register" class="text-primary hover:text-cyan-300 font-medium transition-colors">
                Cadastre-se grátis
            </a>
        </div>

    </div>
</div>
```

**Descrição Detalhada:**

*   **Estrutura da Página**: O componente ocupa a altura total da tela (`min-h-screen`) e centraliza o formulário de login.
*   **Contêiner do Formulário**: Um `div` com `max-w-md w-full bg-dark-800 rounded-xl shadow-2xl p-8 border border-dark-700` define o estilo do contêiner do formulário, incluindo largura máxima, fundo escuro, bordas arredondadas e sombra.
*   **Título e Subtítulo**:
    *   `<h2>Bem-vindo de volta</h2>`: Título principal do formulário.
    *   `<p>Entre para continuar assistindo</p>`: Subtítulo informativo.
*   **Mensagem de Erro**:
    *   `<div *ngIf="errorMessage()" ... > {{ errorMessage() }} </div>`: Exibe uma mensagem de erro condicionalmente, se `errorMessage()` no componente TypeScript tiver um valor. Estilizado com cores vermelhas para indicar erro.
*   **Formulário de Login (`<form>`)**:
    *   `[formGroup]="loginForm"`: Vincula o formulário HTML a uma instância de `FormGroup` chamada `loginForm` no componente TypeScript, permitindo o uso de formulários reativos do Angular.
    *   `(ngSubmit)="onSubmit()"`: Chama o método `onSubmit()` no componente TypeScript quando o formulário é enviado.
    *   **Campos de Entrada (Email e Senha)**:
        *   `<label for="email" ... >Email</label>`: Rótulo para o campo de email.
        *   `<input id="email" type="email" formControlName="email" ... >`: Campo de entrada para o email, vinculado ao controle de formulário `email`.
        *   `<label for="password" ... >Senha</label>`: Rótulo para o campo de senha.
        *   `<input id="password" type="password" formControlName="password" ... >`: Campo de entrada para a senha, vinculado ao controle de formulário `password`.
        *   **Estilização**: Ambos os campos de entrada utilizam classes Tailwind CSS para estilização (fundo escuro, bordas, texto branco, foco).
*   **Botão de Envio**:
    *   `<button type="submit" [disabled]="loginForm.invalid || authService.isLoading()" ... >`: Botão para enviar o formulário.
    *   `[disabled]="loginForm.invalid || authService.isLoading()"`: O botão é desabilitado se o formulário for inválido (não preenchido corretamente) ou se `authService.isLoading()` for `true` (indicando que uma requisição está em andamento).
    *   **Texto Condicional**:
        *   `<span *ngIf="authService.isLoading()">Entrando...</span>`: Exibe "Entrando..." quando a requisição está em andamento.
        *   `<span *ngIf="!authService.isLoading()">Entrar</span>`: Exibe "Entrar" quando nenhuma requisição está em andamento.
*   **Link para Cadastro**:
    *   `<a routerLink="/auth/register" ... >Cadastre-se grátis</a>`: Um link que utiliza `routerLink` para navegar para a página de registro (`/auth/register`).

## src/app/features/auth/login/login.component.scss

Este arquivo de estilos SCSS está vazio. Atualmente, o componente `LoginComponent` não possui estilos CSS/SCSS específicos definidos neste arquivo. Presumivelmente, ele utiliza estilos globais ou classes de utilidade (como Tailwind CSS).

```scss

```

**Descrição Detalhada:**

Este arquivo não contém nenhuma declaração de estilo no momento.

## src/app/features/auth/login/login.component.ts

Este componente gerencia a lógica do formulário de login, a comunicação com o serviço de autenticação e a exibição de mensagens de erro.

```typescript
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);

  errorMessage = signal<string>('');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMessage.set('');

      this.authService.login({
        email: this.loginForm.value.email!,
        password: this.loginForm.value.password!
      }).subscribe({
        error: (err) => this.errorMessage.set(err)
      });
    }
  }
}
```

**Descrição Detalhada:**

*   **`@Component` Decorator**:
    *   `selector: 'app-login'`: Define o seletor HTML para este componente.
    *   `standalone: true`: Indica que é um componente *standalone*.
    *   `imports`: Lista os módulos e componentes que este componente usa:
        *   `CommonModule`: Para diretivas como `*ngIf`.
        *   `ReactiveFormsModule`: Para trabalhar com formulários reativos.
        *   `RouterLink`: Para o link de navegação para a página de registro.
    *   `templateUrl: './login.component.html'`: Aponta para o arquivo de template HTML do componente.
*   **`LoginComponent` Class**:
    *   **Injeção de Dependências**:
        *   `private fb = inject(FormBuilder)`: Injeta o `FormBuilder` para criar e gerenciar formulários reativos.
        *   `public authService = inject(AuthService)`: Injeta o `AuthService` para realizar operações de autenticação. É `public` para ser acessível no template.
    *   **Propriedades**:
        *   `errorMessage = signal<string>('')`: Um *signal* para armazenar e exibir mensagens de erro para o usuário. Inicializado como uma string vazia.
        *   `loginForm = this.fb.group(...)`: Define o formulário reativo `loginForm` com dois controles:
            *   `email`: Inicializado como vazio, com validadores `Validators.required` (obrigatório) e `Validators.email` (formato de email válido).
            *   `password`: Inicializado como vazio, com validadores `Validators.required` (obrigatório) e `Validators.minLength(6)` (mínimo de 6 caracteres).
    *   **`onSubmit()` Method**:
        *   Chamado quando o formulário de login é enviado.
        *   `if (this.loginForm.valid)`: Verifica se o formulário é válido.
        *   `this.errorMessage.set('')`: Limpa qualquer mensagem de erro anterior.
        *   `this.authService.login(...)`: Chama o método `login` do `AuthService` com os valores do email e senha do formulário.
        *   `.subscribe({ error: (err) => this.errorMessage.set(err) })`: Se a chamada de login resultar em um erro, a mensagem de erro retornada é definida no *signal* `errorMessage`, que será exibida no template.

## src/app/features/auth/register/register.component.html

Este é o template HTML do componente `RegisterComponent`, que fornece a interface de usuário para o formulário de registro de novos usuários.

```html
<div class="min-h-screen flex items-center justify-center bg-dark-900 px-4 py-12">
    <div class="max-w-md w-full bg-dark-800 rounded-xl shadow-2xl p-8 border border-dark-700">

        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-white mb-2">Crie sua conta</h2>
            <p class="text-gray-400">Comece a assistir hoje mesmo</p>
        </div>

        <div *ngIf="errorMessage()" class="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-500 text-sm"
            [innerHTML]="errorMessage()">
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-5">

            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nome de Usuário</label>
                <input type="text" formControlName="userName"
                    class="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
                <span
                    *ngIf="registerForm.get('userName')?.touched && registerForm.get('userName')?.errors?.['required']"
                    class="text-xs text-red-400">Nome é obrigatório</span>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" formControlName="email"
                    class="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
                <span *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.errors?.['email']"
                    class="text-xs text-red-400">Email inválido</span>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                <input type="password" formControlName="password"
                    class="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
                <span
                    *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.errors?.['minlength']"
                    class="text-xs text-red-400">Mínimo 6 caracteres</span>
            </div>

            <button type="submit" [disabled]="registerForm.invalid || authService.isLoading()"
                class="w-full bg-primary hover:bg-cyan-400 text-dark-900 font-bold py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="authService.isLoading()">Criando conta...</span>
                <span *ngIf="!authService.isLoading()">Cadastrar</span>
            </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-400">
            Já tem uma conta?
            <a routerLink="/auth/login" class="text-primary hover:text-cyan-300 font-medium transition-colors">
                Faça Login
            </a>
        </div>

    </div>
</div>
```

**Descrição Detalhada:**

*   **Estrutura da Página**: O componente ocupa a altura total da tela (`min-h-screen`) e centraliza o formulário de registro.
*   **Contêiner do Formulário**: Um `div` com `max-w-md w-full bg-dark-800 rounded-xl shadow-2xl p-8 border border-dark-700` define o estilo do contêiner do formulário, incluindo largura máxima, fundo escuro, bordas arredondadas e sombra.
*   **Título e Subtítulo**:
    *   `<h2>Crie sua conta</h2>`: Título principal do formulário.
    *   `<p>Comece a assistir hoje mesmo</p>`: Subtítulo informativo.
*   **Mensagem de Erro**:
    *   `<div *ngIf="errorMessage()" ... [innerHTML]="errorMessage()">`: Exibe uma mensagem de erro condicionalmente, se `errorMessage()` no componente TypeScript tiver um valor. Utiliza `[innerHTML]` para permitir mensagens de erro formatadas com HTML (como quebras de linha).
*   **Formulário de Registro (`<form>`)**:
    *   `[formGroup]="registerForm"`: Vincula o formulário HTML a uma instância de `FormGroup` chamada `registerForm` no componente TypeScript.
    *   `(ngSubmit)="onSubmit()"`: Chama o método `onSubmit()` no componente TypeScript quando o formulário é enviado.
    *   **Campos de Entrada (Nome de Usuário, Email e Senha)**:
        *   `<label ... >Nome de Usuário</label>`: Rótulo para o campo de nome de usuário.
        *   `<input type="text" formControlName="userName" ... >`: Campo de entrada para o nome de usuário, vinculado ao controle de formulário `userName`.
        *   `<span *ngIf="registerForm.get('userName')?.touched && registerForm.get('userName')?.errors?.['required']" ... >Nome é obrigatório</span>`: Exibe uma mensagem de validação se o campo `userName` foi tocado e está vazio.
        *   `<label ... >Email</label>`: Rótulo para o campo de email.
        *   `<input type="email" formControlName="email" ... >`: Campo de entrada para o email, vinculado ao controle de formulário `email`.
        *   `<span *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.errors?.['email']" ... >Email inválido</span>`: Exibe uma mensagem de validação se o campo `email` foi tocado e não é um email válido.
        *   `<label ... >Senha</label>`: Rótulo para o campo de senha.
        *   `<input type="password" formControlName="password" ... >`: Campo de entrada para a senha, vinculado ao controle de formulário `password`.
        *   `<span *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.errors?.['minlength']" ... >Mínimo 6 caracteres</span>`: Exibe uma mensagem de validação se o campo `password` foi tocado e não atinge o comprimento mínimo.
        *   **Estilização**: Todos os campos de entrada utilizam classes Tailwind CSS para estilização (fundo escuro, bordas, texto branco, foco).
*   **Botão de Envio**:
    *   `<button type="submit" [disabled]="registerForm.invalid || authService.isLoading()" ... >`: Botão para enviar o formulário.
    *   `[disabled]="registerForm.invalid || authService.isLoading()"`: O botão é desabilitado se o formulário for inválido ou se `authService.isLoading()` for `true`.
    *   **Texto Condicional**:
        *   `<span *ngIf="authService.isLoading()">Criando conta...</span>`: Exibe "Criando conta..." quando a requisição está em andamento.
        *   `<span *ngIf="!authService.isLoading()">Cadastrar</span>`: Exibe "Cadastrar" quando nenhuma requisição está em andamento.
*   **Link para Login**:
    *   `<a routerLink="/auth/login" ... >Faça Login</a>`: Um link que utiliza `routerLink` para navegar para a página de login (`/auth/login`).

## src/app/features/auth/register/register.component.scss

Este arquivo de estilos SCSS está vazio. Atualmente, o componente `RegisterComponent` não possui estilos CSS/SCSS específicos definidos neste arquivo. Presumivelmente, ele utiliza estilos globais ou classes de utilidade (como Tailwind CSS).

```scss

```

**Descrição Detalhada:**

Este arquivo não contém nenhuma declaração de estilo no momento.

## src/app/features/auth/register/register.component.ts

Este componente gerencia a lógica do formulário de registro, a comunicação com o serviço de autenticação e a exibição de mensagens de erro.

```typescript
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  errorMessage = signal<string>('');

  registerForm = this.fb.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      this.errorMessage.set('');

      this.authService.register({
        userName: this.registerForm.value.userName!,
        email: this.registerForm.value.email!,
        password: this.registerForm.value.password!
      }).subscribe({
        error: (err) => this.errorMessage.set(err)
      });
    }
  }
}
```

**Descrição Detalhada:**

*   **`@Component` Decorator**:
    *   `selector: 'app-register'`: Define o seletor HTML para este componente.
    *   `standalone: true`: Indica que é um componente *standalone*.
    *   `imports`: Lista os módulos e componentes que este componente usa:
        *   `CommonModule`: Para diretivas como `*ngIf`.
        *   `ReactiveFormsModule`: Para trabalhar com formulários reativos.
        *   `RouterLink`: Para o link de navegação para a página de login.
    *   `templateUrl: './register.component.html'`: Aponta para o arquivo de template HTML do componente.
*   **`RegisterComponent` Class**:
    *   **Injeção de Dependências**:
        *   `private fb = inject(FormBuilder)`: Injeta o `FormBuilder` para criar e gerenciar formulários reativos.
        *   `public authService = inject(AuthService)`: Injeta o `AuthService` para realizar operações de autenticação. É `public` para ser acessível no template.
    *   **Propriedades**:
        *   `errorMessage = signal<string>('')`: Um *signal* para armazenar e exibir mensagens de erro para o usuário.
        *   `registerForm = this.fb.group(...)`: Define o formulário reativo `registerForm` com três controles:
            *   `userName`: Inicializado como vazio, com validador `Validators.required`.
            *   `email`: Inicializado como vazio, com validadores `Validators.required` e `Validators.email`.
            *   `password`: Inicializado como vazio, com validadores `Validators.required` e `Validators.minLength(6)`.
    *   **`onSubmit()` Method**:
        *   Chamado quando o formulário de registro é enviado.
        *   `if (this.registerForm.valid)`: Verifica se o formulário é válido.
        *   `this.errorMessage.set('')`: Limpa qualquer mensagem de erro anterior.
        *   `this.authService.register(...)`: Chama o método `register` do `AuthService` com os valores do nome de usuário, email e senha do formulário.
        *   `.subscribe({ error: (err) => this.errorMessage.set(err) })`: Se a chamada de registro resultar em um erro, a mensagem de erro retornada é definida no *signal* `errorMessage`, que será exibida no template.

