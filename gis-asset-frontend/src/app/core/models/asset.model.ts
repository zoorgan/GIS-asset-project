
export type AssetType =
  | 'WATER_VALVE'
  | 'ELECTRIC_POLE'
  | 'MANHOLE'
  | 'FIRE_HYDRANT'
  | 'STREET_LIGHT'
  | 'SUBSTATION'
  | 'CELL_TOWER'
  | 'OTHER';

export type AssetStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export const ASSET_TYPES: readonly AssetType[] = [
  'WATER_VALVE',
  'ELECTRIC_POLE',
  'MANHOLE',
  'FIRE_HYDRANT',
  'STREET_LIGHT',
  'SUBSTATION',
  'CELL_TOWER',
  'OTHER',
] as const;

export const ASSET_STATUSES: readonly AssetStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;


export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  WATER_VALVE: 'Water Valve',
  ELECTRIC_POLE: 'Electric Pole',
  MANHOLE: 'Manhole',
  FIRE_HYDRANT: 'Fire Hydrant',
  STREET_LIGHT: 'Street Light',
  SUBSTATION: 'Substation',
  CELL_TOWER: 'Cell Tower',
  OTHER: 'Other',
};

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  description: string | null;
  latitude: number;
  longitude: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}


export interface AssetWithDistance extends Asset {
  distanceMeters: number;
}

export interface CreateAssetPayload {
  name: string;
  type: AssetType;
  status?: AssetStatus;
  description?: string | null;
  latitude: number;
  longitude: number;
  metadata?: Record<string, unknown>;
}

export type UpdateAssetPayload = Partial<CreateAssetPayload>;


export interface AssetListQuery {
  type?: AssetType;
  status?: AssetStatus;
  page?: number;
  pageSize?: number;
}


export interface SpatialSearchQuery {
  lat: number;
  lng: number;
  radius: number;
  type?: AssetType;
  limit?: number;
}


export interface LatLngPoint {
  lat: number;
  lng: number;
}
