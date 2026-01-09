import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Hls from 'hls.js';
import { catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../../../environments/environment'; // Importa as variáveis de ambiente
import { AuthService } from '../../../core/auth/auth.service';
import { MovieDetails } from '../../../core/models/movie.models';
import { MovieAppService } from '../../../core/services/movie-app.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: "./movie-details.component.html",
  styleUrls: ['./movie-details.component.css'] // Importa o novo arquivo CSS
})
export class MovieDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Injections
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieAppService);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  // View Child para o elemento de vídeo e controles
  @ViewChild('videoPlayer') videoElementRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('speedSelect') speedSelectRef!: ElementRef<HTMLSelectElement>;
  @ViewChild('progressBar') progressBarRef!: ElementRef<HTMLInputElement>;
  @ViewChild('volumeSlider') volumeSliderRef!: ElementRef<HTMLInputElement>;
  @ViewChild('videoContainer') videoContainerRef!: ElementRef<HTMLDivElement>;


  // Signals e State
  movie = signal<MovieDetails | null>(null);
  isLoading = signal(true);
  isFavoriteLoading = signal(false);
  isFavorited = signal(false); // Controle local visual

  isPlaying = signal(false);
  isMuted = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  isFullscreen = signal(false);
  
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

          const videoSrc = `${environment.streamingApiBaseUrl}/${this.movieId}`;
          this.initPlayer(videoSrc);
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
    if (this.videoElementRef) {
        const video = this.videoElementRef.nativeElement;

        // Define o volume inicial e atualiza o slider
        video.volume = 1; 
        if (this.volumeSliderRef) {
          this.volumeSliderRef.nativeElement.value = '1';
        }

        // Anexa listeners de tempo e progresso
        video.addEventListener('timeupdate', () => this.updateProgressBar());
        video.addEventListener('loadedmetadata', () => {
            this.duration.set(video.duration);
            this.updateProgressBar(); // Garante que a barra seja atualizada após carregar metadados
        });
        video.addEventListener('play', () => this.isPlaying.set(true));
        video.addEventListener('pause', () => this.isPlaying.set(false));
        video.addEventListener('ended', () => this.isPlaying.set(false));
        video.addEventListener('volumechange', () => this.isMuted.set(video.muted || video.volume === 0));

        // Listener para a barra de progresso (arrastar)
        if (this.progressBarRef) {
            this.progressBarRef.nativeElement.addEventListener('input', (event: Event) => this.seek(event));
        }

        // Listener para o controle de volume (arrastar)
        if (this.volumeSliderRef) {
          this.volumeSliderRef.nativeElement.addEventListener('input', (event: Event) => this.setVolume(event));
        }

        // Listener para o modo tela cheia
        document.addEventListener('fullscreenchange', () => {
          this.isFullscreen.set(!!document.fullscreenElement);
        });
    }
  }

  initPlayer(src: string) {
    if (Hls.isSupported()) {
      // Destruir instância anterior se existir
      if (this.hls) {
        this.hls.destroy();
      }

      this.hls = new Hls();
      
      this.hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        data.details.fragments.forEach(fragment => {
          fragment.url = `${environment.streamingApiBaseUrl}/${this.movieId}/${fragment.relurl}`;
        });
      });

      this.hls.loadSource(src);
      
      // Anexar ao elemento HTML
      if (this.videoElementRef) {
        this.hls.attachMedia(this.videoElementRef.nativeElement);
        // O player é inicializado no subscribe e ngAfterViewInit, a reprodução será controlada pelo botão
      }
    } else if (this.videoElementRef?.nativeElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback para Safari (suporte nativo)
      this.videoElementRef.nativeElement.src = src;
      // O player é inicializado no subscribe e ngAfterViewInit, a reprodução será controlada pelo botão
    }
  }

  togglePlayPause() {
    if (this.videoElementRef) {
      const video = this.videoElementRef.nativeElement;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      this.isPlaying.set(!video.paused);
    }
  }

  toggleMute() {
    if (this.videoElementRef) {
      const video = this.videoElementRef.nativeElement;
      video.muted = !video.muted;
      this.isMuted.set(video.muted);
    }
  }

  setVolume(event: Event) {
    if (this.videoElementRef && this.volumeSliderRef) {
      const video = this.videoElementRef.nativeElement;
      const slider = this.volumeSliderRef.nativeElement;
      video.volume = parseFloat(slider.value);
      this.isMuted.set(video.volume === 0);
    }
  }

  setPlaybackSpeed(speed: string) {
    if (this.videoElementRef) {
      this.videoElementRef.nativeElement.playbackRate = parseFloat(speed);
    }
  }

  seek(event: Event) {
    if (this.videoElementRef && this.progressBarRef) {
      const video = this.videoElementRef.nativeElement;
      const progressBar = this.progressBarRef.nativeElement;
      const seekTime = (parseFloat(progressBar.value) / 100) * (isNaN(video.duration) ? 0 : video.duration);
      video.currentTime = seekTime;
    }
  }

  updateProgressBar() {
    if (this.videoElementRef && this.progressBarRef) {
      const video = this.videoElementRef.nativeElement;
      const progressBar = this.progressBarRef.nativeElement;
      const current = isNaN(video.currentTime) ? 0 : video.currentTime;
      const total = isNaN(video.duration) ? 0 : video.duration;
      const progress = (current / total) * 100;

      progressBar.value = isNaN(progress) ? '0' : progress.toString(); 
      this.currentTime.set(current);
      this.duration.set(total);

      // Atualiza a variável CSS customizada para o preenchimento da barra
      progressBar.style.setProperty('--progress-percentage', `${progress || 0}%`);
    }
  }

  toggleFullscreen() {
    if (this.videoContainerRef) {
      const videoContainer = this.videoContainerRef.nativeElement;
      if (!document.fullscreenElement) {
        videoContainer.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    }
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
    // Removendo o listener global de fullscreen para evitar vazamentos de memória
    document.removeEventListener('fullscreenchange', () => {
      this.isFullscreen.set(!!document.fullscreenElement);
    });
  }
}