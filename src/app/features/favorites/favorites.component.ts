// src/app/features/favorites/favorites.component.ts

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MovieSummary } from '../../core/models/movie.models';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./favorites.component.html",
})
export class FavoritesComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  favorites = signal<MovieSummary[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites() {
    this.isLoading.set(true);
    const profileId = this.authService.getProfileId();

    this.profileService.getFavorites(profileId).subscribe({
      next: (pagedList) => {
        this.favorites.set(pagedList.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar favoritos:', err);
        this.isLoading.set(false);
        this.favorites.set([]);
        // Em um app real, você trataria o erro de forma visual (ex: snackbar)
      }
    });
  }
}