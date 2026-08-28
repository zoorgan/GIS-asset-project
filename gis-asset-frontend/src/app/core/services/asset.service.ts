import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiErrorResponse,
  ApiPaginationMeta,
  ApiSuccessResponse,
} from '../models/api-response.model';
import {
  Asset,
  AssetListQuery,
  AssetWithDistance,
  CreateAssetPayload,
  SpatialSearchQuery,
  UpdateAssetPayload,
} from '../models/asset.model';


export interface AssetListResult {
  items: Asset[];
  meta: ApiPaginationMeta;
}


export class AssetApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: ApiErrorResponse['error']['details']
  ) {
    super(message);
    this.name = 'AssetApiError';
  }
}


@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/assets`;


  list(query: AssetListQuery = {}): Observable<AssetListResult> {
    const params = this.buildParams(query as Record<string, unknown>);

    return this.http
      .get<ApiSuccessResponse<Asset[]>>(this.baseUrl, { params })
      .pipe(
        map((res) => ({
          items: res.data,
          meta: (res.meta as unknown as ApiPaginationMeta) ?? {
            page: 1,
            pageSize: res.data.length,
            total: res.data.length,
            totalPages: 1,
          },
        })),
        catchError((err: HttpErrorResponse) => this.handleError(err))
      );
  }


  getById(id: string): Observable<Asset> {
    return this.http.get<ApiSuccessResponse<Asset>>(`${this.baseUrl}/${id}`).pipe(
      map((res) => res.data),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }


  spatialSearch(query: SpatialSearchQuery): Observable<AssetWithDistance[]> {
    const params = this.buildParams(query as unknown as Record<string, unknown>);

    return this.http
      .get<ApiSuccessResponse<AssetWithDistance[]>>(`${this.baseUrl}/spatial-search`, { params })
      .pipe(
        map((res) => res.data),
        catchError((err: HttpErrorResponse) => this.handleError(err))
      );
  }


  create(payload: CreateAssetPayload): Observable<Asset> {
    return this.http.post<ApiSuccessResponse<Asset>>(this.baseUrl, payload).pipe(
      map((res) => res.data),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }


  update(id: string, payload: UpdateAssetPayload): Observable<Asset> {
    return this.http.put<ApiSuccessResponse<Asset>>(`${this.baseUrl}/${id}`, payload).pipe(
      map((res) => res.data),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }


  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }


  private buildParams(source: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }


  private handleError(err: HttpErrorResponse): Observable<never> {
    const body = err.error as ApiErrorResponse | undefined;
    const message = body?.error?.message ?? err.message ?? 'An unexpected error occurred';
    const code = body?.error?.code ?? 'UNKNOWN_ERROR';
    return throwError(() => new AssetApiError(message, code, err.status, body?.error?.details));
  }
}
