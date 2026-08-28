import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AssetService, AssetApiError } from './asset.service';
import { environment } from '../../../environments/environment';
import { Asset, AssetWithDistance, CreateAssetPayload, UpdateAssetPayload } from '../models/asset.model';
import { ApiSuccessResponse } from '../models/api-response.model';

describe('AssetService', () => {
  let service: AssetService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/assets`;

  const mockAsset: Asset = {
    id: 'asset-1',
    name: 'Main Water Valve',
    type: 'WATER_VALVE',
    status: 'ACTIVE',
    latitude: 31.95,
    longitude: 35.91,
    description: 'Central distribution valve',
    metadata: {},
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AssetService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AssetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch assets and map pagination metadata', () => {
      const mockResponse: ApiSuccessResponse<Asset[]> = {
        success: true,
        data: [mockAsset],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      };

      service.list({ type: 'WATER_VALVE', status: 'ACTIVE' }).subscribe((result) => {
        expect(result.items.length).toBe(1);
        expect(result.items[0]).toEqual(mockAsset);
        expect(result.meta.total).toBe(1);
        expect(result.meta.page).toBe(1);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl && r.method === 'GET');
      expect(req.request.params.get('type')).toBe('WATER_VALVE');
      expect(req.request.params.get('status')).toBe('ACTIVE');
      req.flush(mockResponse);
    });

    it('should generate fallback metadata when meta is missing', () => {
      const mockResponse = {
        success: true,
        data: [mockAsset],
      };

      service.list().subscribe((result) => {
        expect(result.items.length).toBe(1);
        expect(result.meta.page).toBe(1);
        expect(result.meta.pageSize).toBe(1);
        expect(result.meta.total).toBe(1);
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockResponse);
    });

    it('should transform HTTP error into AssetApiError', () => {
      service.list().subscribe({
        next: () => fail('expected error'),
        error: (err: AssetApiError) => {
          expect(err).toBeInstanceOf(AssetApiError);
          expect(err.code).toBe('FETCH_FAILED');
          expect(err.status).toBe(500);
          expect(err.message).toBe('Server internal error');
        },
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        { success: false, error: { message: 'Server internal error', code: 'FETCH_FAILED' } },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('getById', () => {
    it('should retrieve a single asset by id', () => {
      service.getById('asset-1').subscribe((asset) => {
        expect(asset).toEqual(mockAsset);
      });

      const req = httpMock.expectOne(`${baseUrl}/asset-1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockAsset });
    });

    it('should handle 404 not found error', () => {
      service.getById('non-existent').subscribe({
        next: () => fail('expected 404 error'),
        error: (err: AssetApiError) => {
          expect(err.status).toBe(404);
          expect(err.code).toBe('ASSET_NOT_FOUND');
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/non-existent`);
      req.flush(
        { success: false, error: { message: 'Asset not found', code: 'ASSET_NOT_FOUND' } },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });

  describe('spatialSearch', () => {
    it('should send lat, lng, and radius params', () => {
      const mockResult: AssetWithDistance[] = [{ ...mockAsset, distanceMeters: 250 }];

      service.spatialSearch({ lat: 31.95, lng: 35.91, radius: 1000, type: 'WATER_VALVE' }).subscribe((res) => {
        expect(res.length).toBe(1);
        expect(res[0].distanceMeters).toBe(250);
      });

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/spatial-search`);
      expect(req.request.params.get('lat')).toBe('31.95');
      expect(req.request.params.get('lng')).toBe('35.91');
      expect(req.request.params.get('radius')).toBe('1000');
      expect(req.request.params.get('type')).toBe('WATER_VALVE');
      req.flush({ success: true, data: mockResult });
    });
  });

  describe('create', () => {
    it('should POST payload and return created asset', () => {
      const payload: CreateAssetPayload = {
        name: 'New Asset',
        type: 'MANHOLE',
        status: 'ACTIVE',
        latitude: 31.9,
        longitude: 35.9,
      };

      service.create(payload).subscribe((created) => {
        expect(created.id).toBe('asset-new');
        expect(created.name).toBe('New Asset');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: { ...mockAsset, id: 'asset-new', name: 'New Asset' } });
    });
  });

  describe('update', () => {
    it('should PUT payload and return updated asset', () => {
      const payload: UpdateAssetPayload = { name: 'Updated Valve Name' };

      service.update('asset-1', payload).subscribe((updated) => {
        expect(updated.name).toBe('Updated Valve Name');
      });

      const req = httpMock.expectOne(`${baseUrl}/asset-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: { ...mockAsset, name: 'Updated Valve Name' } });
    });
  });

  describe('delete', () => {
    it('should DELETE asset by id', () => {
      service.delete('asset-1').subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/asset-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
