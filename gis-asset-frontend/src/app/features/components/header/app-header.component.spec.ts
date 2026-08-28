import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AppHeaderComponent } from './app-header.component';
import { AuthStore } from '../../../core/state/auth.store';
import { PublicUser } from '../../../core/models';

describe('AppHeaderComponent', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;
  let router: Router;

  const mockUserSignal = signal<PublicUser | null>(null);
  const mockIsAuthSignal = signal<boolean>(false);
  const mockIsAdminSignal = signal<boolean>(false);
  const mockLogoutSpy = jasmine.createSpy('logout');

  beforeEach(async () => {
    mockUserSignal.set(null);
    mockIsAuthSignal.set(false);
    mockIsAdminSignal.set(false);
    mockLogoutSpy.calls.reset();

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            user: mockUserSignal,
            isAuthenticated: mockIsAuthSignal,
            isAdmin: mockIsAdminSignal,
            logout: mockLogoutSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should call authStore.logout and navigate to /login on logout()', () => {
    component.logout();
    expect(mockLogoutSpy).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('should display user information when authenticated', () => {
    mockIsAuthSignal.set(true);
    mockUserSignal.set({
      id: 'u-1',
      username: 'gis_admin',
      role: 'ADMIN',
    });
    mockIsAdminSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('gis_admin');
  });
});
