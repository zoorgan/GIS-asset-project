
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
  createdAt: Date;
  updatedAt: Date;
}


export interface AssetWithDistance extends Asset {
  distanceMeters: number;
}

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  status?: AssetStatus;
  description?: string | null;
  latitude: number;
  longitude: number;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}

export interface UpdateAssetInput {
  name?: string;
  type?: AssetType;
  status?: AssetStatus;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, unknown>;
}

export interface AssetFilter {
  type?: AssetType;
  status?: AssetStatus;
}

export interface SpatialSearchParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type?: AssetType;
  limit?: number;
}

export const ASSET_TYPES: readonly AssetType[] = [
  'WATER_VALVE', 'ELECTRIC_POLE', 'MANHOLE', 'FIRE_HYDRANT',
  'STREET_LIGHT', 'SUBSTATION', 'CELL_TOWER', 'OTHER',
];

export const ASSET_STATUSES: readonly AssetStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
