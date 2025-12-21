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

export interface MovieDetails {
    id: string;
    name: string;
    synopsis: string;
    imageUrl: string;
    pathM3U8File: string; // A URL do vídeo
    releaseDate: string;
    views: number;
    genries: GenreSummary[]; // Atenção: O backend enviou "Genries"
    createdDate: string;
    updatedDate: string;
}

// Tipo de resposta final para /api/movies
export type MoviesApiResponse = ApiResponse<IPagedList<MovieSummary>>;

export type MovieDetailsApiResponse = ApiResponse<MovieDetails>;

// Tipo de resposta final para /api/genres
// O GenresController não usa o ResponseBase<T> no retorno (aparentemente retorna a lista pura ou outro formato),
// Mas, para manter a consistência, vamos assumir que ele retorna ResponseBase<GenreSummary[]> ou ResponseBase<IPagedList<GenreSummary>> se tiver paginação.
// Pelo GenresController.cs, a função é Ok(await _genreFacade.GetAllGenresAsync()), vamos assumir que retorna um array.
export type GenresApiResponse = ApiResponse<GenreSummary[]>;