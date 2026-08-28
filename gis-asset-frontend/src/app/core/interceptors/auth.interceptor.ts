import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../state/auth.store';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);
  const token = isApiRequest ? authStore.token() : null;

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (isApiRequest && err instanceof HttpErrorResponse && err.status === 401) {
        authStore.logout();
      }
      return throwError(() => err);
    })
  );
};
