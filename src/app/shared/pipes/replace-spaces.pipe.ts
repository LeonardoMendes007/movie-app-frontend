import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceSpaces',
  standalone: true
})
export class ReplaceSpacesPipe implements PipeTransform {
  /**
   * Converte uma string (como nome de gênero) para um "slug" amigável para URL.
   * Ex: "Ficção Científica" -> "ficcao-cientifica"
   */
  transform(value: string, replaceChar: string = '-'): string {
    if (!value) {
      return '';
    }
    
    // 1. Converte para minúsculas
    let slug = value.toLowerCase();
    
    // 2. Remove acentos e caracteres especiais (normalização)
    slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    
    // 3. Substitui espaços e outros caracteres não alfanuméricos por "replaceChar" (padrão é hífen)
    slug = slug.replace(/\s+/g, replaceChar) // Substitui múltiplos espaços por hífen
                 .replace(/[^\w-]+/g, '');    // Remove qualquer caractere que não seja palavra ou hífen

    return slug;
  }
}