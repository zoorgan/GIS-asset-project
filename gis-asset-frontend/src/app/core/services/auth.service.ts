import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiErrorResponse, ApiSuccessResponse } from '../models/api-response.model';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.model';


export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiSuccessResponse<LoginResponse>>(`${this.baseUrl}/login`, payload).pipe(
      map((res) => res.data),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  register(payload: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<ApiSuccessResponse<LoginResponse>>(`${this.baseUrl}/register`, payload).pipe(
      map((res) => res.data),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const body = err.error as ApiErrorResponse | undefined;
    const message = body?.error?.message ?? err.message ?? 'An unexpected error occurred';
    const code = body?.error?.code ?? 'UNKNOWN_ERROR';
    return throwError(() => new AuthApiError(message, code, err.status));
  }
}
