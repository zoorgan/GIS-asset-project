import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AssetStore, FILTER_ALL } from './asset.store';
import { AssetService, AssetApiError, AssetListResult } from '../services/asset.service';
import { Asset, AssetWithDistance, CreateAssetPayload, UpdateAssetPayload } from '../models/asset.model';

describe('AssetStore', () => {
  let store: AssetStore;
  let assetServiceSpy: jasmine.SpyObj<AssetService>;

  const mockAsset1: Asset = {
    id: 'asset-1',
    name: 'Water Valve A',
    type: 'WATER_VALVE',
    status: 'ACTIVE',
    latitude: 31.95,
    longitude: 35.91,
    description: 'Valve 1',
    metadata: {},
    createdBy: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockAsset2: Asset = {
    id: 'asset-2',
    name: 'Electric Pole B',
    type: 'ELECTRIC_POLE',
    status: 'MAINTENANCE',
    latitude: 31.96,
    longitude: 35.92,
    description: 'Pole 2',
    metadata: {},
    createdBy: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    assetServiceSpy = jasmine.createSpyObj('AssetService', [
      'list',
      'getById',
      'spatialSearch',
      'create',
      'update',
      'delete',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AssetStore,
        { provide: AssetService, useValue: assetServiceSpy },
      ],
    });

    store = TestBed.inject(AssetStore);
  });

  it('should initialize with default values', () => {
    expect(store.assets()).toEqual([]);
    expect(store.loading()).toBeFalse();
    expect(store.error()).toBeNull();
    expect(store.selectedAssetId()).toBeNull();
    expect(store.typeFilter()).toBe(FILTER_ALL);
    expect(store.statusFilter()).toBe(FILTER_ALL);
    expect(store.isSpatialSearchActive()).toBeFalse();
    expect(store.resultCount()).toBe(0);
  });

  describe('loadAssets', () => {
    it('should set assets on successful load', () => {
      const listResult: AssetListResult = {
        items: [mockAsset1, mockAsset2],
        meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
      };
      assetServiceSpy.list.and.returnValue(of(listResult));

      store.loadAssets();

      expect(store.loading()).toBeFalse();
      expect(store.assets()).toEqual([mockAsset1, mockAsset2]);
      expect(store.error()).toBeNull();
    });

    it('should handle load errors and update error signal', () => {
      const error = new AssetApiError('Failed to fetch', 'FETCH_ERROR', 500);
      assetServiceSpy.list.and.returnValue(throwError(() => error));

      store.loadAssets();

      expect(store.loading()).toBeFalse();
      expect(store.error()).toBe('Failed to fetch');
    });
  });

  describe('filtering and computed signals', () => {
    beforeEach(() => {
      const listResult: AssetListResult = {
        items: [mockAsset1, mockAsset2],
        meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
      };
      assetServiceSpy.list.and.returnValue(of(listResult));
      store.loadAssets();
    });

    it('should filter assets by type', () => {
      store.setTypeFilter('WATER_VALVE');
      expect(store.filteredAssets().length).toBe(1);
      expect(store.filteredAssets()[0].id).toBe('asset-1');

      store.setTypeFilter('ELECTRIC_POLE');
      expect(store.filteredAssets().length).toBe(1);
      expect(store.filteredAssets()[0].id).toBe('asset-2');
    });

    it('should filter assets by status', () => {
      store.setStatusFilter('MAINTENANCE');
      expect(store.filteredAssets().length).toBe(1);
      expect(store.filteredAssets()[0].id).toBe('asset-2');
    });

    it('should reset filters', () => {
      store.setTypeFilter('WATER_VALVE');
      store.setStatusFilter('ACTIVE');
      expect(store.typeFilter()).toBe('WATER_VALVE');

      store.resetFilters();
      expect(store.typeFilter()).toBe(FILTER_ALL);
      expect(store.statusFilter()).toBe(FILTER_ALL);
      expect(store.filteredAssets().length).toBe(2);
    });

    it('should select asset and compute selectedAsset', () => {
      store.selectAsset('asset-1');
      expect(store.selectedAssetId()).toBe('asset-1');
      expect(store.selectedAsset()).toEqual(mockAsset1);

      store.selectAsset(null);
      expect(store.selectedAsset()).toBeNull();
    });
  });

  describe('spatialSearch and clearSpatialSearch', () => {
    it('should perform spatial search and activate spatial mode', () => {
      const searchResults: AssetWithDistance[] = [
        { ...mockAsset1, distanceMeters: 120 },
      ];
      assetServiceSpy.spatialSearch.and.returnValue(of(searchResults));

      store.spatialSearch({ lat: 31.95, lng: 35.91 }, 500, 'WATER_VALVE');

      expect(store.isSpatialSearchActive()).toBeTrue();
      expect(store.searchRadiusMeters()).toBe(500);
      expect(store.displayedAssets()).toEqual(searchResults);
      expect(store.resultCount()).toBe(1);
    });

    it('should clear spatial search', () => {
      const searchResults: AssetWithDistance[] = [{ ...mockAsset1, distanceMeters: 100 }];
      assetServiceSpy.spatialSearch.and.returnValue(of(searchResults));
      store.spatialSearch({ lat: 31.95, lng: 35.91 }, 500);

      store.clearSpatialSearch();

      expect(store.isSpatialSearchActive()).toBeFalse();
      expect(store.searchCenter()).toBeNull();
      expect(store.selectedAssetId()).toBeNull();
    });
  });

  describe('createAsset, updateAsset, deleteAsset', () => {
    beforeEach(() => {
      assetServiceSpy.list.and.returnValue(
        of({ items: [mockAsset1], meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 } })
      );
      store.loadAssets();
    });

    it('should prepend created asset to the list', (done) => {
      const payload: CreateAssetPayload = {
        name: 'New Asset',
        type: 'MANHOLE',
        status: 'ACTIVE',
        latitude: 31.9,
        longitude: 35.9,
      };
      const createdAsset: Asset = { ...mockAsset2, id: 'asset-new', name: 'New Asset' };
      assetServiceSpy.create.and.returnValue(of(createdAsset));

      store.createAsset(payload).subscribe((res) => {
        expect(res).toEqual(createdAsset);
        expect(store.assets().length).toBe(2);
        expect(store.assets()[0].id).toBe('asset-new');
        done();
      });
    });

    it('should update existing asset in the list', (done) => {
      const payload: UpdateAssetPayload = { name: 'Updated Name' };
      const updatedAsset: Asset = { ...mockAsset1, name: 'Updated Name' };
      assetServiceSpy.update.and.returnValue(of(updatedAsset));

      store.updateAsset('asset-1', payload).subscribe((res) => {
        expect(res.name).toBe('Updated Name');
        expect(store.assets().find((a) => a.id === 'asset-1')?.name).toBe('Updated Name');
        done();
      });
    });

    it('should remove deleted asset and reset selection if it was selected', (done) => {
      store.selectAsset('asset-1');
      assetServiceSpy.delete.and.returnValue(of(undefined as unknown as void));

      store.deleteAsset('asset-1').subscribe(() => {
        expect(store.assets().length).toBe(0);
        expect(store.selectedAssetId()).toBeNull();
        done();
      });
    });
  });
});
