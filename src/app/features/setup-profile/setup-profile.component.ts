// src/app/features/setup-profile/setup-profile.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-setup-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./setup-profile.component.html"
})
export class SetupProfileComponent {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  previewUrl = signal<string | null>(null);
  
  // Imagem padrão caso o user não suba nada (igual Netflix smile)
  readonly defaultImage = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';

  form = this.fb.group({
    userName: ['', [Validators.required, Validators.maxLength(50)]],
    imageUrl: [''] // Este campo receberá a string Base64
  });

  // Evento ao selecionar arquivo
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validação simples de tamanho (ex: max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64String = e.target.result;
        this.previewUrl.set(base64String);
        this.form.patchValue({ imageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.isLoading.set(true);
      
      const request = {
        // Pega o ID real do Auth
        id: this.authService.getProfileId(), 
        userName: this.form.value.userName!,
        // Se não tiver imagem upada, manda a padrão
        imageUrl: this.form.value.imageUrl || this.defaultImage 
      };

      this.profileService.createProfile(request).subscribe({
        next: () => {
          // Força o reload do perfil no service para atualizar a navbar quando redirecionar
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Erro ao criar perfil:', err);
          this.isLoading.set(false);
          // Aqui você pode usar seu toast/snackbar de erro
        }
      });
    }
  }
}