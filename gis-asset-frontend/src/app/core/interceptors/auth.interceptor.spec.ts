import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../state/auth.store';
import { environment } from '../../../environments/environment';
import { signal } from '@angular/core';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authStoreSpy: jasmine.SpyObj<AuthStore>;
  const tokenSignal = signal<string | null>(null);

  beforeEach(() => {
    tokenSignal.set(null);
    authStoreSpy = jasmine.createSpyObj('AuthStore', ['logout'], {
      token: tokenSignal,
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: authStoreSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Authorization header when token is present for API requests', () => {
    tokenSignal.set('mock-jwt-token-123');

    httpClient.get(`${environment.apiBaseUrl}/assets`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/assets`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-123');
    req.flush({});
  });

  it('should NOT attach Authorization header when token is null', () => {
    tokenSignal.set(null);

    httpClient.get(`${environment.apiBaseUrl}/assets`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/assets`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should NOT attach Authorization header for non-API external requests', () => {
    tokenSignal.set('mock-jwt-token-123');

    httpClient.get('https://external-api.com/data').subscribe();

    const req = httpMock.expectOne('https://external-api.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should trigger authStore.logout on 401 Unauthorized API response', () => {
    httpClient.get(`${environment.apiBaseUrl}/assets`).subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/assets`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authStoreSpy.logout).toHaveBeenCalled();
  });
});
