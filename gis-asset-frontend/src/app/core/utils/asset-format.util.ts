import { Asset, AssetWithDistance } from '../models/asset.model';


export function hasDistance(asset: Asset | AssetWithDistance): asset is AssetWithDistance {
  return typeof (asset as AssetWithDistance).distanceMeters === 'number';
}


export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}
