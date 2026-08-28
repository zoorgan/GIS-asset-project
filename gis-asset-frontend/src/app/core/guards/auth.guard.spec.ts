import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, guestGuard } from './auth.guard';
import { AuthStore } from '../state/auth.store';

describe('AuthGuards', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  const isAuthSignal = signal<boolean>(false);

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/workspace' } as RouterStateSnapshot;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    isAuthSignal.set(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: { isAuthenticated: isAuthSignal } },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow navigation when user is authenticated', () => {
      isAuthSignal.set(true);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBeTrue();
    });

    it('should redirect to /login with redirectTo param when user is not authenticated', () => {
      isAuthSignal.set(false);
      const expectedTree = {} as UrlTree;
      routerSpy.createUrlTree.and.returnValue(expectedTree);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(expectedTree);
      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { redirectTo: '/workspace' },
      });
    });
  });

  describe('guestGuard', () => {
    it('should allow navigation when user is NOT authenticated', () => {
      isAuthSignal.set(false);

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result).toBeTrue();
    });

    it('should redirect to root / when user IS authenticated', () => {
      isAuthSignal.set(true);
      const expectedTree = {} as UrlTree;
      routerSpy.createUrlTree.and.returnValue(expectedTree);

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result).toBe(expectedTree);
      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });
});
