import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthStore } from '../../core/state/auth.store';

/**
 * Login page. Talks exclusively to AuthStore — never to AuthService or
 * HttpClient directly — keeping the same layering discipline as the
 * asset feature (component -> store -> service -> API).
 *
 * Field-level validation runs entirely client-side for responsiveness;
 * the backend re-validates everything independently (never trust
 * client-only checks), so a mismatch just surfaces as a normal API error
 * here rather than a security gap.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./auth-shared.scss'],
})
export class LoginComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authStore.login(this.form.getRawValue()).subscribe({
      next: () => {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/';
        this.router.navigateByUrl(redirectTo);
      },
      error: () => {
        // AuthStore already recorded the failure into its `error` signal,
        // which the template renders inline — nothing further to do here
        // beyond not letting the rejection propagate as unhandled.
      },
    });
  }
}
