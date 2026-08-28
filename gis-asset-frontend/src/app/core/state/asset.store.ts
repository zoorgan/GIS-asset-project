import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { AssetApiError, AssetService } from '../services/asset.service';
import {
  Asset,
  AssetStatus,
  AssetType,
  AssetWithDistance,
  CreateAssetPayload,
  LatLngPoint,
  UpdateAssetPayload,
} from '../models/asset.model';


export const FILTER_ALL = 'ALL' as const;
export type TypeFilter = AssetType | typeof FILTER_ALL;
export type StatusFilter = AssetStatus | typeof FILTER_ALL;


@Injectable({ providedIn: 'root' })
export class AssetStore {
  private readonly assetService = inject(AssetService);


  private readonly _assets = signal<Asset[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  private readonly _selectedAssetId = signal<string | null>(null);

  private readonly _typeFilter = signal<TypeFilter>(FILTER_ALL);
  private readonly _statusFilter = signal<StatusFilter>(FILTER_ALL);

  private readonly _searchCenter = signal<LatLngPoint | null>(null);
  private readonly _searchRadiusMeters = signal<number>(1000);
  private readonly _searchResults = signal<AssetWithDistance[] | null>(null);
  private readonly _isSpatialSearchActive = signal<boolean>(false);
  private readonly _searchLoading = signal<boolean>(false);


  readonly assets = this._assets.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly selectedAssetId = this._selectedAssetId.asReadonly();

  readonly typeFilter = this._typeFilter.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();

  readonly searchCenter = this._searchCenter.asReadonly();
  readonly searchRadiusMeters = this._searchRadiusMeters.asReadonly();
  readonly isSpatialSearchActive = this._isSpatialSearchActive.asReadonly();
  readonly searchLoading = this._searchLoading.asReadonly();


  readonly filteredAssets = computed<Asset[]>(() => {
    const type = this._typeFilter();
    const status = this._statusFilter();
    return this._assets().filter(
      (a) => (type === FILTER_ALL || a.type === type) && (status === FILTER_ALL || a.status === status)
    );
  });


  readonly displayedAssets = computed<Asset[] | AssetWithDistance[]>(() =>
    this._isSpatialSearchActive() ? this._searchResults() ?? [] : this.filteredAssets()
  );


  readonly selectedAsset = computed<Asset | AssetWithDistance | null>(() => {
    const id = this._selectedAssetId();
    if (!id) return null;
    return this.displayedAssets().find((a) => a.id === id) ?? null;
  });

  readonly resultCount = computed<number>(() => this.displayedAssets().length);


  loadAssets(): void {
    this._loading.set(true);
    this._error.set(null);

    this.assetService
      .list()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (result) => this._assets.set(result.items),
        error: (err: AssetApiError) => this._error.set(err.message),
      });
  }

  setTypeFilter(type: TypeFilter): void {
    this._typeFilter.set(type);
  }

  setStatusFilter(status: StatusFilter): void {
    this._statusFilter.set(status);
  }

  resetFilters(): void {
    this._typeFilter.set(FILTER_ALL);
    this._statusFilter.set(FILTER_ALL);
  }

  selectAsset(id: string | null): void {
    this._selectedAssetId.set(id);
  }


  spatialSearch(center: LatLngPoint, radiusMeters: number, type?: TypeFilter): void {
    this._searchLoading.set(true);
    this._error.set(null);
    this._searchCenter.set(center);
    this._searchRadiusMeters.set(radiusMeters);

    const typeParam = type && type !== FILTER_ALL ? type : undefined;

    this.assetService
      .spatialSearch({ lat: center.lat, lng: center.lng, radius: radiusMeters, type: typeParam })
      .pipe(finalize(() => this._searchLoading.set(false)))
      .subscribe({
        next: (results) => {
          this._searchResults.set(results);
          this._isSpatialSearchActive.set(true);
        },
        error: (err: AssetApiError) => this._error.set(err.message),
      });
  }


  clearSpatialSearch(): void {
    this._isSpatialSearchActive.set(false);
    this._searchResults.set(null);
    this._searchCenter.set(null);
    this._selectedAssetId.set(null);
  }


  createAsset(payload: CreateAssetPayload): Observable<Asset> {
    return this.assetService.create(payload).pipe(
      tap((created) => {
        this._assets.update((list) => [created, ...list]);
        this.refreshActiveSearchIfAny();
      }),
      catchError((err: AssetApiError) => {
        this._error.set(err.message);
        return throwError(() => err);
      })
    );
  }

  updateAsset(id: string, payload: UpdateAssetPayload): Observable<Asset> {
    return this.assetService.update(id, payload).pipe(
      tap((updated) => {
        this._assets.update((list) => list.map((a) => (a.id === id ? updated : a)));
        this.refreshActiveSearchIfAny();
      }),
      catchError((err: AssetApiError) => {
        this._error.set(err.message);
        return throwError(() => err);
      })
    );
  }

  deleteAsset(id: string): Observable<void> {
    return this.assetService.delete(id).pipe(
      tap(() => {
        this._assets.update((list) => list.filter((a) => a.id !== id));
        if (this._selectedAssetId() === id) {
          this._selectedAssetId.set(null);
        }
        this.refreshActiveSearchIfAny();
      }),
      catchError((err: AssetApiError) => {
        this._error.set(err.message);
        return throwError(() => err);
      })
    );
  }

  clearError(): void {
    this._error.set(null);
  }


  private refreshActiveSearchIfAny(): void {
    const center = this._searchCenter();
    if (this._isSpatialSearchActive() && center) {
      this.spatialSearch(center, this._searchRadiusMeters(), this._typeFilter());
    }
  }
}
