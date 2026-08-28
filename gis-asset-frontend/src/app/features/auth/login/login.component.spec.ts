import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthStore } from '../../../core/state/auth.store';
import { AuthApiError } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let authStoreSpy: {
    login: jasmine.Spy;
    loading: jasmine.Spy;
    error: jasmine.Spy;
  };

  beforeEach(async () => {
    authStoreSpy = {
      login: jasmine.createSpy('login'),
      loading: jasmine.createSpy('loading').and.returnValue(signal(false)()),
      error: jasmine.createSpy('error').and.returnValue(signal(null)()),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideAnimations(),
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'redirectTo' ? '/workspace' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('should initialize empty login form with invalid state', () => {
    expect(component.form.valid).toBeFalse();
    expect(component.form.controls.username.value).toBe('');
    expect(component.form.controls.password.value).toBe('');
  });

  it('should not submit if form is invalid and mark controls as touched', () => {
    component.submit();
    expect(authStoreSpy.login).not.toHaveBeenCalled();
    expect(component.form.controls.username.touched).toBeTrue();
    expect(component.form.controls.password.touched).toBeTrue();
  });

  it('should call authStore.login and navigate to redirectTo query param on success', () => {
    authStoreSpy.login.and.returnValue(
      of({ token: 'test', user: { id: '1', username: 'gis_admin', role: 'ADMIN' } })
    );

    component.form.setValue({ username: 'gis_admin', password: 'Password123' });
    expect(component.form.valid).toBeTrue();

    component.submit();

    expect(authStoreSpy.login).toHaveBeenCalledWith({
      username: 'gis_admin',
      password: 'Password123',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/workspace');
  });

  it('should handle login error gracefully without navigating', () => {
    authStoreSpy.login.and.returnValue(
      throwError(() => new AuthApiError('Invalid credentials', 'AUTH_ERROR', 401))
    );

    component.form.setValue({ username: 'gis_admin', password: 'WrongPassword' });
    component.submit();

    expect(authStoreSpy.login).toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
