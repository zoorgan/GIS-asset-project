import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { RegisterComponent } from './register.component';
import { AuthStore } from '../../../core/state/auth.store';
import { AuthApiError } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;
  let authStoreSpy: {
    register: jasmine.Spy;
    loading: jasmine.Spy;
    error: jasmine.Spy;
  };

  beforeEach(async () => {
    authStoreSpy = {
      register: jasmine.createSpy('register'),
      loading: jasmine.createSpy('loading').and.returnValue(signal(false)()),
      error: jasmine.createSpy('error').and.returnValue(signal(null)()),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideAnimations(),
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('should create register component', () => {
    expect(component).toBeTruthy();
    expect(component.form.valid).toBeFalse();
  });

  it('should validate username pattern and length', () => {
    const usernameCtrl = component.form.controls.username;

    usernameCtrl.setValue('ab');
    expect(usernameCtrl.hasError('minlength')).toBeTrue();

    usernameCtrl.setValue('invalid space');
    expect(usernameCtrl.hasError('pattern')).toBeTrue();

    usernameCtrl.setValue('valid_user.1');
    expect(usernameCtrl.valid).toBeTrue();
  });

  it('should validate password complexity (letters and numbers)', () => {
    const passwordCtrl = component.form.controls.password;

    passwordCtrl.setValue('short1');
    expect(passwordCtrl.hasError('minlength')).toBeTrue();

    passwordCtrl.setValue('allletters');
    expect(passwordCtrl.hasError('pattern')).toBeTrue();

    passwordCtrl.setValue('12345678');
    expect(passwordCtrl.hasError('pattern')).toBeTrue();

    passwordCtrl.setValue('ValidPass123');
    expect(passwordCtrl.valid).toBeTrue();
  });

  it('should validate passwords match', () => {
    component.form.setValue({
      username: 'new_user',
      password: 'Password123',
      confirmPassword: 'DifferentPassword123',
    });
    expect(component.form.hasError('passwordsMismatch')).toBeTrue();

    component.form.controls.confirmPassword.setValue('Password123');
    expect(component.form.hasError('passwordsMismatch')).toBeFalse();
    expect(component.form.valid).toBeTrue();
  });

  it('should submit registration and navigate to / on success', () => {
    authStoreSpy.register.and.returnValue(
      of({ token: 'test', user: { id: '1', username: 'new_user', role: 'VIEWER' } })
    );

    component.form.setValue({
      username: 'new_user',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    component.submit();

    expect(authStoreSpy.register).toHaveBeenCalledWith({
      username: 'new_user',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should not navigate on registration error', () => {
    authStoreSpy.register.and.returnValue(
      throwError(() => new AuthApiError('Username taken', 'CONFLICT', 409))
    );

    component.form.setValue({
      username: 'existing_user',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    component.submit();
    expect(authStoreSpy.register).toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
