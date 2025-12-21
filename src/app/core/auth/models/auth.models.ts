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
    id?: string;
    email?: string;
    name?: string;
  }