import { Asset, AssetWithDistance } from '../models/asset.model';
import { formatDistance, hasDistance } from './asset-format.util';

describe('AssetFormatUtil', () => {
  const baseAsset: Asset = {
    id: 'asset-1',
    name: 'Test Valve',
    type: 'WATER_VALVE',
    status: 'ACTIVE',
    latitude: 31.95,
    longitude: 35.91,
    description: 'Valve desc',
    metadata: {},
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  describe('hasDistance', () => {
    it('should return false for regular Asset without distanceMeters', () => {
      expect(hasDistance(baseAsset)).toBeFalse();
    });

    it('should return true for AssetWithDistance having numeric distanceMeters', () => {
      const assetWithDist: AssetWithDistance = {
        ...baseAsset,
        distanceMeters: 450,
      };
      expect(hasDistance(assetWithDist)).toBeTrue();
    });

    it('should return true when distanceMeters is 0', () => {
      const assetWithDist: AssetWithDistance = {
        ...baseAsset,
        distanceMeters: 0,
      };
      expect(hasDistance(assetWithDist)).toBeTrue();
    });
  });

  describe('formatDistance', () => {
    it('should format distances under 1000m in meters rounded', () => {
      expect(formatDistance(500)).toBe('500 m');
      expect(formatDistance(45.6)).toBe('46 m');
      expect(formatDistance(0)).toBe('0 m');
      expect(formatDistance(999)).toBe('999 m');
      expect(formatDistance(999.4)).toBe('999 m');
    });

    it('should format distances of 1000m and above in km with 2 decimals', () => {
      expect(formatDistance(1000)).toBe('1.00 km');
      expect(formatDistance(1500)).toBe('1.50 km');
      expect(formatDistance(12345)).toBe('12.35 km');
    });
  });
});
