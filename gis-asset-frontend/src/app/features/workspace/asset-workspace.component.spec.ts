import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { AssetWorkspaceComponent } from './asset-workspace.component';
import { AssetStore } from '../../core/state/asset.store';
import { AuthStore } from '../../core/state/auth.store';
import { Asset, AssetWithDistance, LatLngPoint } from '../../core/models';

describe('AssetWorkspaceComponent', () => {
  let component: AssetWorkspaceComponent;
  let fixture: ComponentFixture<AssetWorkspaceComponent>;
  let assetStoreSpy: jasmine.SpyObj<AssetStore>;
  let authStoreSpy: jasmine.SpyObj<AuthStore>;

  const mockAsset: Asset = {
    id: 'asset-1',
    name: 'Workspace Test Asset',
    type: 'WATER_VALVE',
    status: 'ACTIVE',
    latitude: 31.95,
    longitude: 35.91,
    description: 'Valve desc',
    metadata: {},
    createdBy: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const assetsSignal = signal<Asset[]>([mockAsset]);
  const displayedAssetsSignal = signal<(Asset | AssetWithDistance)[]>([mockAsset]);
  const loadingSignal = signal<boolean>(false);
  const errorSignal = signal<string | null>(null);
  const selectedAssetIdSignal = signal<string | null>(null);
  const typeFilterSignal = signal<any>('ALL');
  const statusFilterSignal = signal<any>('ALL');
  const isSpatialSearchActiveSignal = signal<boolean>(false);
  const searchCenterSignal = signal<LatLngPoint | null>(null);
  const searchRadiusMetersSignal = signal<number>(1000);
  const searchLoadingSignal = signal<boolean>(false);
  const resultCountSignal = signal<number>(1);
  const isAdminSignal = signal<boolean>(true);

  beforeEach(async () => {
    assetsSignal.set([mockAsset]);
    displayedAssetsSignal.set([mockAsset]);
    loadingSignal.set(false);
    errorSignal.set(null);
    selectedAssetIdSignal.set(null);
    typeFilterSignal.set('ALL');
    statusFilterSignal.set('ALL');
    isSpatialSearchActiveSignal.set(false);
    searchCenterSignal.set(null);
    searchRadiusMetersSignal.set(1000);
    searchLoadingSignal.set(false);
    resultCountSignal.set(1);
    isAdminSignal.set(true);

    assetStoreSpy = jasmine.createSpyObj(
      'AssetStore',
      ['loadAssets', 'selectAsset', 'clearError', 'setTypeFilter', 'setStatusFilter', 'clearSpatialSearch'],
      {
        assets: assetsSignal,
        displayedAssets: displayedAssetsSignal,
        loading: loadingSignal,
        error: errorSignal,
        selectedAssetId: selectedAssetIdSignal,
        typeFilter: typeFilterSignal,
        statusFilter: statusFilterSignal,
        isSpatialSearchActive: isSpatialSearchActiveSignal,
        searchCenter: searchCenterSignal,
        searchRadiusMeters: searchRadiusMetersSignal,
        searchLoading: searchLoadingSignal,
        resultCount: resultCountSignal,
      }
    );

    authStoreSpy = jasmine.createSpyObj('AuthStore', [], {
      isAdmin: isAdminSignal,
    });

    await TestBed.configureTestingModule({
      imports: [AssetWorkspaceComponent],
      providers: [
        provideAnimations(),
        { provide: AssetStore, useValue: assetStoreSpy },
        { provide: AuthStore, useValue: authStoreSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create workspace and call loadAssets on init', () => {
    expect(component).toBeTruthy();
    expect(assetStoreSpy.loadAssets).toHaveBeenCalled();
  });

  it('should update pendingSearchCenter onMapClick', () => {
    const point: LatLngPoint = { lat: 31.95, lng: 35.91 };
    component.onMapClick(point);
    expect(component.pendingSearchCenter()).toEqual(point);
  });

  it('should open details dialog on onViewDetails', () => {
    component.onViewDetails(mockAsset);
    expect(component.detailsAsset()).toEqual(mockAsset);
    expect(component.detailsVisible()).toBeTrue();
  });

  it('should update details visibility on onDetailsVisibleChange', () => {
    component.onDetailsVisibleChange(false);
    expect(component.detailsVisible()).toBeFalse();
  });

  it('should open create dialog with null asset on openCreateDialog', () => {
    component.openCreateDialog();
    expect(component.formAsset()).toBeNull();
    expect(component.formVisible()).toBeTrue();
  });

  it('should open edit dialog with selected asset on onEditAsset', () => {
    component.onEditAsset(mockAsset);
    expect(component.formAsset()).toEqual(mockAsset);
    expect(component.formVisible()).toBeTrue();
  });

  it('should select saved asset in store on onAssetSaved', () => {
    component.onAssetSaved(mockAsset);
    expect(assetStoreSpy.selectAsset).toHaveBeenCalledWith('asset-1');
  });
});
