import * as L from 'leaflet';
import { Asset, AssetStatus, AssetType, AssetWithDistance, ASSET_TYPE_LABELS } from '../../core/models';
import { formatDistance, hasDistance } from '../../core/utils/asset-format.util';


export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  WATER_VALVE: '#2196F3',
  ELECTRIC_POLE: '#FF9800',
  MANHOLE: '#795548',
  FIRE_HYDRANT: '#E53935',
  STREET_LIGHT: '#FDD835',
  SUBSTATION: '#8E24AA',
  CELL_TOWER: '#00897B',
  OTHER: '#607D8B',
};


export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


export class MarkerIconFactory {
  private readonly cache = new Map<string, L.DivIcon>();

  getIcon(type: AssetType, status: AssetStatus): L.DivIcon {
    const key = `${type}::${status}`;
    let icon = this.cache.get(key);
    if (!icon) {
      icon = this.buildIcon(type, status);
      this.cache.set(key, icon);
    }
    return icon;
  }

  clear(): void {
    this.cache.clear();
  }

  private buildIcon(type: AssetType, status: AssetStatus): L.DivIcon {
    const color = ASSET_TYPE_COLORS[type];
    const opacity = status === 'INACTIVE' ? 0.4 : status === 'MAINTENANCE' ? 0.7 : 1;
    const borderStyle = status === 'MAINTENANCE' ? 'dashed' : 'solid';

    return L.divIcon({
      className: 'asset-marker-icon',
      html: `<div class="asset-pin" style="background:${color};opacity:${opacity};border-style:${borderStyle}"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -14],
    });
  }
}


export function buildPopupContent(asset: Asset | AssetWithDistance): string {
  const name = escapeHtml(asset.name);
  const typeLabel = escapeHtml(ASSET_TYPE_LABELS[asset.type] ?? asset.type);
  const statusLabel = escapeHtml(asset.status);
  const description = asset.description ? escapeHtml(asset.description) : null;
  const distanceRow = hasDistance(asset)
    ? `<div class="asset-popup__row"><span class="asset-popup__label">Distance</span><span>${formatDistance(
        asset.distanceMeters
      )}</span></div>`
    : '';

  return `
    <div class="asset-popup">
      <div class="asset-popup__title">${name}</div>
      <div class="asset-popup__row"><span class="asset-popup__label">Type</span><span>${typeLabel}</span></div>
      <div class="asset-popup__row"><span class="asset-popup__label">Status</span><span>${statusLabel}</span></div>
      <div class="asset-popup__row"><span class="asset-popup__label">Coordinates</span><span>${asset.latitude.toFixed(
        5
      )}, ${asset.longitude.toFixed(5)}</span></div>
      ${distanceRow}
      ${description ? `<div class="asset-popup__desc">${description}</div>` : ''}
    </div>
  `.trim();
}
