import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="text-2xl lg:text-3xl font-bold text-white mb-4 flex items-center">
      <span class="mr-3 text-primary">{{ icon }}</span>
      {{ title }}
    </h2>
  `
})
export class SectionTitleComponent {
  // Título da seção (ex: "Populares")
  @Input({ required: true }) title!: string; 
  // Um ícone simples para dar um toque visual (ex: "🔥" ou "🌟")
  @Input() icon: string = ''; 
}