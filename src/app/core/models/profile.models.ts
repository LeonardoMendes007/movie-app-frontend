import { ApiResponse } from "./api-response.model";

export interface CreateProfileRequest {
    id: string;       // O GUID que vem do Identity (Auth)
    userName: string; // Limite de 50 chars conforme seu Validator
    imageUrl?: string;
}

export interface ProfileSummary {
    id: string;
    userName: string;
    imageUrl: string;
    createdDate: string;
    updatedDate: string;
}


export type ProfileApiResponse = ApiResponse<ProfileSummary>;