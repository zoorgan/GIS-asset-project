import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { AuthApiError, AuthService } from '../services/auth.service';
import { LoginRequest, LoginResponse, PublicUser, RegisterRequest } from '../models/auth.model';

const SESSION_STORAGE_KEY = 'gis_auth_session';

interface PersistedSession {
  token: string;
  user: PublicUser;
}


@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<PublicUser | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor() {
    this.restoreSession();
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.authService.login(payload).pipe(
      tap((result) => this.persistSession(result)),
      catchError((err: AuthApiError) => {
        this._error.set(err.message);
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  register(payload: RegisterRequest): Observable<LoginResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.authService.register(payload).pipe(
      tap((result) => this.persistSession(result)),
      catchError((err: AuthApiError) => {
        this._error.set(err.message);
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }


  logout(): void {
    this._token.set(null);
    this._user.set(null);
    this.clearPersistedSession();
  }

  clearError(): void {
    this._error.set(null);
  }

  private persistSession(result: LoginResponse): void {
    this._token.set(result.token);
    this._user.set(result.user);

    if (typeof localStorage === 'undefined') return;
    const session: PersistedSession = { token: result.token, user: result.user };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private restoreSession(): void {
    if (typeof localStorage === 'undefined') return;

    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PersistedSession;
      this._token.set(parsed.token);
      this._user.set(parsed.user);
    } catch {

      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private clearPersistedSession(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
