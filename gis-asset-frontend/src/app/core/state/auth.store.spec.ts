import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthService, AuthApiError } from '../services/auth.service';
import { LoginResponse } from '../models/auth.model';

describe('AuthStore', () => {
  let store: AuthStore;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockLoginResponse: LoginResponse = {
    token: 'jwt-token-xyz',
    expiresIn: '24h',
    user: {
      id: 'u-1',
      username: 'admin_user',
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register']);

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    store = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize unauthenticated when no session is in localStorage', () => {
    expect(store.token()).toBeNull();
    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.isAdmin()).toBeFalse();
  });

  it('should restore session from localStorage on initialization', () => {
    localStorage.setItem(
      'gis_auth_session',
      JSON.stringify({ token: 'restored-token', user: mockLoginResponse.user })
    );

    // Create a new instance to test constructor restoration
    const newStore = new AuthStore();
    expect(newStore.token()).toBe('restored-token');
    expect(newStore.isAuthenticated()).toBeTrue();
    expect(newStore.isAdmin()).toBeTrue();
  });

  describe('login', () => {
    it('should set token and user on successful login and persist to localStorage', (done) => {
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));

      store.login({ username: 'admin_user', password: 'Password123' }).subscribe((res) => {
        expect(res).toEqual(mockLoginResponse);
        expect(store.token()).toBe('jwt-token-xyz');
        expect(store.user()?.username).toBe('admin_user');
        expect(store.isAuthenticated()).toBeTrue();
        expect(store.isAdmin()).toBeTrue();
        expect(localStorage.getItem('gis_auth_session')).toBeTruthy();
        done();
      });
    });

    it('should handle login failure and set error signal', (done) => {
      const err = new AuthApiError('Invalid credentials', 'AUTH_ERROR', 401);
      authServiceSpy.login.and.returnValue(throwError(() => err));

      store.login({ username: 'bad', password: 'pwd' }).subscribe({
        next: () => fail('expected login error'),
        error: (e) => {
          expect(e).toBe(err);
          expect(store.error()).toBe('Invalid credentials');
          expect(store.isAuthenticated()).toBeFalse();
          done();
        },
      });
    });
  });

  describe('register', () => {
    it('should register and persist user session', (done) => {
      authServiceSpy.register.and.returnValue(of(mockLoginResponse));

      store.register({
        username: 'admin_user',
        password: 'Password123',
        confirmPassword: 'Password123',
      }).subscribe((res) => {
        expect(res).toEqual(mockLoginResponse);
        expect(store.isAuthenticated()).toBeTrue();
        done();
      });
    });
  });

  describe('logout', () => {
    it('should clear signals and remove session from localStorage', () => {
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));
      store.login({ username: 'admin_user', password: 'Password123' }).subscribe();

      expect(store.isAuthenticated()).toBeTrue();

      store.logout();

      expect(store.token()).toBeNull();
      expect(store.user()).toBeNull();
      expect(store.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem('gis_auth_session')).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should reset error signal to null', () => {
      const err = new AuthApiError('Some error', 'ERR', 400);
      authServiceSpy.login.and.returnValue(throwError(() => err));
      store.login({ username: 'bad', password: 'pwd' }).subscribe({ error: () => {} });

      expect(store.error()).toBe('Some error');
      store.clearError();
      expect(store.error()).toBeNull();
    });
  });
});
