import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, AuthApiError } from './auth.service';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/auth`;

  const mockLoginResponse: LoginResponse = {
    token: 'jwt-test-token-12345',
    expiresIn: '24h',
    user: {
      id: 'user-1',
      username: 'gis_admin',
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should authenticate user and return token and user details', () => {
      const payload: LoginRequest = { username: 'gis_admin', password: 'Password123' };

      service.login(payload).subscribe((res) => {
        expect(res.token).toBe('jwt-test-token-12345');
        expect(res.user.username).toBe('gis_admin');
        expect(res.user.role).toBe('ADMIN');
      });

      const req = httpMock.expectOne(`${baseUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: mockLoginResponse });
    });

    it('should throw AuthApiError on invalid credentials (401)', () => {
      const payload: LoginRequest = { username: 'wrong', password: 'bad' };

      service.login(payload).subscribe({
        next: () => fail('expected authentication error'),
        error: (err: AuthApiError) => {
          expect(err).toBeInstanceOf(AuthApiError);
          expect(err.code).toBe('INVALID_CREDENTIALS');
          expect(err.status).toBe(401);
          expect(err.message).toBe('Invalid username or password');
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/login`);
      req.flush(
        { success: false, error: { message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' } },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('register', () => {
    it('should register a new user and return login response', () => {
      const payload: RegisterRequest = {
        username: 'newuser',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      service.register(payload).subscribe((res) => {
        expect(res.token).toBe('jwt-test-token-12345');
        expect(res.user.username).toBe('gis_admin');
      });

      const req = httpMock.expectOne(`${baseUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: mockLoginResponse });
    });

    it('should throw AuthApiError on conflict (409)', () => {
      const payload: RegisterRequest = {
        username: 'existinguser',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      service.register(payload).subscribe({
        next: () => fail('expected conflict error'),
        error: (err: AuthApiError) => {
          expect(err.status).toBe(409);
          expect(err.code).toBe('USERNAME_EXISTS');
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/register`);
      req.flush(
        { success: false, error: { message: 'Username already exists', code: 'USERNAME_EXISTS' } },
        { status: 409, statusText: 'Conflict' }
      );
    });
  });
});
