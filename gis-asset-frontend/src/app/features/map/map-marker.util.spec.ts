import { Asset, AssetWithDistance } from '../../core/models';
import {
  ASSET_TYPE_COLORS,
  MarkerIconFactory,
  buildPopupContent,
  escapeHtml,
} from './map-marker.util';

describe('MapMarkerUtil', () => {
  const mockAsset: Asset = {
    id: 'a-1',
    name: 'Main Pipe <Valve & Test>',
    type: 'WATER_VALVE',
    status: 'ACTIVE',
    latitude: 31.951234,
    longitude: 35.912345,
    description: 'Special "desc" \'quote\'',
    metadata: {},
    createdBy: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  describe('escapeHtml', () => {
    it('should sanitize HTML special characters', () => {
      const input = `<script>alert("xss & 'test'")</script>`;
      const expected = `&lt;script&gt;alert(&quot;xss &amp; &#39;test&#39;)&lt;/script&gt;`;
      expect(escapeHtml(input)).toBe(expected);
    });
  });

  describe('MarkerIconFactory', () => {
    let factory: MarkerIconFactory;

    beforeEach(() => {
      factory = new MarkerIconFactory();
    });

    it('should create and cache a DivIcon for given type and status', () => {
      const icon1 = factory.getIcon('WATER_VALVE', 'ACTIVE');
      expect(icon1).toBeTruthy();
      expect(icon1.options.className).toBe('asset-marker-icon');

      const icon2 = factory.getIcon('WATER_VALVE', 'ACTIVE');
      expect(icon1).toBe(icon2); // cached reference
    });

    it('should create distinct icons for different statuses', () => {
      const activeIcon = factory.getIcon('WATER_VALVE', 'ACTIVE');
      const inactiveIcon = factory.getIcon('WATER_VALVE', 'INACTIVE');
      const maintenanceIcon = factory.getIcon('WATER_VALVE', 'MAINTENANCE');

      expect(activeIcon).not.toBe(inactiveIcon);
      expect(activeIcon).not.toBe(maintenanceIcon);
    });

    it('should clear cache upon calling clear()', () => {
      const icon1 = factory.getIcon('WATER_VALVE', 'ACTIVE');
      factory.clear();
      const icon2 = factory.getIcon('WATER_VALVE', 'ACTIVE');
      expect(icon1).not.toBe(icon2);
    });
  });

  describe('buildPopupContent', () => {
    it('should format popup HTML with escaped properties', () => {
      const html = buildPopupContent(mockAsset);

      expect(html).toContain('Main Pipe &lt;Valve &amp; Test&gt;');
      expect(html).toContain('Water Valve');
      expect(html).toContain('ACTIVE');
      expect(html).toContain('31.95123, 35.91235');
      expect(html).toContain('Special &quot;desc&quot; &#39;quote&#39;');
      expect(html).not.toContain('Distance');
    });

    it('should include distance row when asset has distanceMeters', () => {
      const assetWithDist: AssetWithDistance = {
        ...mockAsset,
        distanceMeters: 450,
      };

      const html = buildPopupContent(assetWithDist);
      expect(html).toContain('Distance');
      expect(html).toContain('450 m');
    });
  });
});
