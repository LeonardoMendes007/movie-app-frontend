import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center h-40">
      <div 
        class="w-12 h-12 border-4 border-t-4 border-primary/50 border-t-primary rounded-full animate-spin"
      ></div>
      <span class="ml-4 text-gray-400">Carregando conteúdo...</span>
    </div>
  `,
  styles: [`
    /* A animação é feita puramente pelo Tailwind/CSS */
  `]
})
export class LoadingSpinnerComponent {}