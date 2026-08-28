import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AssetMapComponent } from './asset-map.component';
import { AssetStore } from '../../core/state/asset.store';
import { Asset, AssetWithDistance, LatLngPoint } from '../../core/models';

describe('AssetMapComponent', () => {
  let component: AssetMapComponent;
  let fixture: ComponentFixture<AssetMapComponent>;
  let assetStoreSpy: jasmine.SpyObj<AssetStore>;

  const mockAsset: Asset = {
    id: 'asset-1',
    name: 'Map Test Asset',
    type: 'FIRE_HYDRANT',
    status: 'ACTIVE',
    latitude: 31.95,
    longitude: 35.91,
    description: 'Hydrant at corner',
    metadata: {},
    createdBy: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const displayedAssetsSignal = signal<(Asset | AssetWithDistance)[]>([mockAsset]);
  const selectedAssetIdSignal = signal<string | null>(null);
  const isSpatialSearchActiveSignal = signal<boolean>(false);
  const searchCenterSignal = signal<LatLngPoint | null>(null);
  const searchRadiusMetersSignal = signal<number>(1000);

  beforeEach(async () => {
    displayedAssetsSignal.set([mockAsset]);
    selectedAssetIdSignal.set(null);
    isSpatialSearchActiveSignal.set(false);
    searchCenterSignal.set(null);
    searchRadiusMetersSignal.set(1000);

    assetStoreSpy = jasmine.createSpyObj('AssetStore', ['selectAsset'], {
      displayedAssets: displayedAssetsSignal,
      selectedAssetId: selectedAssetIdSignal,
      isSpatialSearchActive: isSpatialSearchActiveSignal,
      searchCenter: searchCenterSignal,
      searchRadiusMeters: searchRadiusMetersSignal,
    });

    await TestBed.configureTestingModule({
      imports: [AssetMapComponent],
      providers: [{ provide: AssetStore, useValue: assetStoreSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the map component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the map container element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.asset-map');
    expect(container).toBeTruthy();
  });

  it('should clean up map resources on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
