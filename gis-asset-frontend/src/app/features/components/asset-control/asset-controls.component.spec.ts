import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { AssetControlsComponent } from './asset-controls.component';
import { AssetStore } from '../../../core/state/asset.store';

describe('AssetControlsComponent', () => {
  let component: AssetControlsComponent;
  let fixture: ComponentFixture<AssetControlsComponent>;
  let assetStoreSpy: jasmine.SpyObj<AssetStore>;

  const typeFilterSignal = signal<any>('ALL');
  const statusFilterSignal = signal<any>('ALL');
  const isSpatialSearchActiveSignal = signal<boolean>(false);
  const searchLoadingSignal = signal<boolean>(false);
  const resultCountSignal = signal<number>(5);

  beforeEach(async () => {
    typeFilterSignal.set('ALL');
    statusFilterSignal.set('ALL');
    isSpatialSearchActiveSignal.set(false);
    searchLoadingSignal.set(false);
    resultCountSignal.set(5);

    assetStoreSpy = jasmine.createSpyObj(
      'AssetStore',
      ['setTypeFilter', 'setStatusFilter', 'resetFilters', 'spatialSearch', 'clearSpatialSearch'],
      {
        typeFilter: typeFilterSignal,
        statusFilter: statusFilterSignal,
        isSpatialSearchActive: isSpatialSearchActiveSignal,
        searchLoading: searchLoadingSignal,
        resultCount: resultCountSignal,
      }
    );

    await TestBed.configureTestingModule({
      imports: [AssetControlsComponent],
      providers: [
        provideAnimations(),
        { provide: AssetStore, useValue: assetStoreSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create asset controls component', () => {
    expect(component).toBeTruthy();
    expect(component.typeOptions.length).toBeGreaterThan(1);
    expect(component.statusOptions.length).toBeGreaterThan(1);
  });

  it('should update store type filter onTypeChange', () => {
    component.onTypeChange('WATER_VALVE');
    expect(assetStoreSpy.setTypeFilter).toHaveBeenCalledWith('WATER_VALVE');
  });

  it('should update store status filter onStatusChange', () => {
    component.onStatusChange('MAINTENANCE');
    expect(assetStoreSpy.setStatusFilter).toHaveBeenCalledWith('MAINTENANCE');
  });

  it('should run spatial search when pendingSearchCenter is provided', () => {
    component.pendingSearchCenter = { lat: 31.95, lng: 35.91 };
    component.radiusMeters.set(2500);
    typeFilterSignal.set('FIRE_HYDRANT');

    component.runSpatialSearch();

    expect(assetStoreSpy.spatialSearch).toHaveBeenCalledWith(
      { lat: 31.95, lng: 35.91 },
      2500,
      'FIRE_HYDRANT'
    );
  });

  it('should NOT run spatial search when pendingSearchCenter is null', () => {
    component.pendingSearchCenter = null;
    component.runSpatialSearch();
    expect(assetStoreSpy.spatialSearch).not.toHaveBeenCalled();
  });

  it('should clear spatial search', () => {
    component.clearSearch();
    expect(assetStoreSpy.clearSpatialSearch).toHaveBeenCalled();
  });
});
