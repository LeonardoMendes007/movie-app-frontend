import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Hls from 'hls.js';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { MovieDetails } from '../../../core/models/movie.models';
import { MovieAppService } from '../../../core/services/movie-app.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./movie-details.component.html"
})
export class MovieDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Injections
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieAppService);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  // View Child para o elemento de vídeo
  @ViewChild('videoPlayer') videoElementRef!: ElementRef<HTMLVideoElement>;

  // Signals e State
  movie = signal<MovieDetails | null>(null);
  isLoading = signal(true);
  isFavoriteLoading = signal(false);
  isFavorited = signal(false); // Controle local visual
  
  private hls: Hls | null = null;
  private movieId: string | null = null;

  ngOnInit() {
    this.movieId = this.route.snapshot.paramMap.get('id');

    if (this.movieId) {
      this.isLoading.set(true);
      const profileId = this.authService.getProfileId();
      
      // Combina a busca de detalhes do filme E o estado do favorito.
      forkJoin({
        movieDetails: this.movieService.getMovieById(this.movieId),
        favoriteIds: this.profileService.getFavoriteMovieIds(profileId).pipe(
          // Se der erro ao buscar favoritos (ex: perfil não encontrado, mas isso 
          // já é barrado pelo Guard), retorne lista vazia para não quebrar a tela.
          catchError(() => of([])) 
        )
      }).subscribe({
        next: ({ movieDetails, favoriteIds }) => {
          this.movie.set(movieDetails);
          // 1. Checa o estado inicial do favorito
          this.isFavorited.set((favoriteIds as string[]).includes(this.movieId!)); 
          this.isLoading.set(false);

          if (movieDetails.pathM3U8File) {
            this.initPlayer(movieDetails.pathM3U8File);
          }
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
          // Opcional: Redirecionar para 404
        }
      });
    }
  }

  ngAfterViewInit(): void {
    // O player é inicializado no subscribe, mas precisamos garantir que a view carregou
  }

  initPlayer(src: string) {
    if (Hls.isSupported()) {
      // Destruir instância anterior se existir
      if (this.hls) {
        this.hls.destroy();
      }

      this.hls = new Hls();
      this.hls.loadSource(src);
      
      // Anexar ao elemento HTML
      if (this.videoElementRef) {
        this.hls.attachMedia(this.videoElementRef.nativeElement);
      }
    } else if (this.videoElementRef?.nativeElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback para Safari (suporte nativo)
      this.videoElementRef.nativeElement.src = src;
    }
  }

  playVideo() {
    this.videoElementRef?.nativeElement.play();
  }

  toggleFavorite() {
    if (!this.movieId) return;

    this.isFavoriteLoading.set(true);
    const profileId = this.authService.getProfileId();

    // Decide qual ação chamar (Adicionar ou Remover)
    const action = this.isFavorited()
      ? this.profileService.removeFavorite(profileId, this.movieId) // 1. Remover
      : this.profileService.addFavorite(profileId, this.movieId);    // 2. Adicionar

    action.subscribe({
      next: () => {
        // Sucesso: Inverte o estado visual
        this.isFavorited.update(fav => !fav); 
        this.isFavoriteLoading.set(false);
        // Opcional: Mostrar Toast de sucesso
      },
      error: (err) => {
        console.error('Erro ao alternar favorito', err);
        this.isFavoriteLoading.set(false);

        // Tratamento para "Movie already exists in favorites" (409)
        // Isso impede que o estado visual fique errado se o backend rejeitar a adição.
        if (err.status === 409 && !this.isFavorited()) {
             console.warn('Filme já estava na lista, forçando estado visual para favorito.');
             this.isFavorited.set(true);
        } else {
             // Lida com outros erros (404, 500 etc)
        }
      }
    });
  }
  

  ngOnDestroy(): void {
    if (this.hls) {
      this.hls.destroy();
    }
  }
}