import { QueryResultRow } from 'pg';
import { query } from '../config/database';
import {
  Asset,
  AssetFilter,
  AssetWithDistance,
  CreateAssetInput,
  SpatialSearchParams,
  UpdateAssetInput,
} from '../models/asset.model';


interface AssetRow extends QueryResultRow {
  id: string;
  name: string;
  type: Asset['type'];
  status: Asset['status'];
  description: string | null;
  latitude: number;
  longitude: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AssetRowWithDistance extends AssetRow {
  distance_meters: number;
}

function mapRow(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    description: row.description,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    metadata: row.metadata ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowWithDistance(row: AssetRowWithDistance): AssetWithDistance {
  return {
    ...mapRow(row),
    distanceMeters: Number(row.distance_meters),
  };
}


export class AssetRepository {
  async findAll(filter: AssetFilter, page: number, pageSize: number): Promise<{ items: Asset[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.type) {
  params.push(filter.type);
  conditions.push(`type = $${params.length}::asset_type`);
}
if (filter.status) {
  params.push(filter.status);
  conditions.push(`status = $${params.length}::asset_status`);
}

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM assets ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    params.push(pageSize);
    const limitIdx = params.length;
    params.push((page - 1) * pageSize);
    const offsetIdx = params.length;

    const result = await query<AssetRow>(
      `SELECT id, name, type, status, description, latitude, longitude,
              metadata, created_by, created_at, updated_at
        FROM assets
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return { items: result.rows.map(mapRow), total };
  }

  async findById(id: string): Promise<Asset | null> {
    const result = await query<AssetRow>(
      `SELECT id, name, type, status, description, latitude, longitude,
              metadata, created_by, created_at, updated_at
        FROM assets WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

 async create(input: CreateAssetInput): Promise<Asset> {
  const result = await query<AssetRow>(
    `INSERT INTO assets (name, type, status, description, latitude, longitude, metadata, created_by)
      VALUES (
        $1, 
        $2::asset_type, 
        COALESCE($3::asset_status, 'ACTIVE'::asset_status), 
        $4, $5, $6, 
        COALESCE($7, '{}'::jsonb), 
        $8
      )
      RETURNING id, name, type, status, description, latitude, longitude,
                metadata, created_by, created_at, updated_at`,
    [
      input.name,
      input.type,
      input.status ?? null,
      input.description ?? null,
      input.latitude,
      input.longitude,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.createdBy ?? null,
    ]
  );
  return mapRow(result.rows[0]);
}

  async update(id: string, input: UpdateAssetInput): Promise<Asset | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];

    const fieldMap: Array<[keyof UpdateAssetInput, string]> = [
      ['name', 'name'],
      ['type', 'type'],
      ['status', 'status'],
      ['description', 'description'],
      ['latitude', 'latitude'],
      ['longitude', 'longitude'],
    ];

    for (const [key, column] of fieldMap) {
      if (input[key] !== undefined) {
        params.push(input[key]);
        setClauses.push(`${column} = $${params.length}`);
      }
    }

    if (input.metadata !== undefined) {
      params.push(JSON.stringify(input.metadata));
      setClauses.push(`metadata = $${params.length}`);
    }

    if (setClauses.length === 0) {
      
      return this.findById(id);
    }

    params.push(id);
    const result = await query<AssetRow>(
      `UPDATE assets SET ${setClauses.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, name, type, status, description, latitude, longitude,
                 metadata, created_by, created_at, updated_at`,
      params
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM assets WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }


  async spatialSearch(params: SpatialSearchParams): Promise<AssetWithDistance[]> {
    const { latitude, longitude, radiusMeters, type, limit = 100 } = params;

    const conditions: string[] = [
      `ST_DWithin(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)`,
    ];
    const queryParams: unknown[] = [latitude, longitude, radiusMeters];

    if (type) {
      queryParams.push(type);
      conditions.push(`type = $${queryParams.length}`);
    }

    queryParams.push(limit);
    const limitIdx = queryParams.length;

    const sql = `
      SELECT
        id, name, type, status, description, latitude, longitude,
        metadata, created_by, created_at, updated_at,
        ST_DistanceSphere(
          geom::geometry,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)
        ) AS distance_meters
      FROM assets
      WHERE ${conditions.join(' AND ')}
      ORDER BY distance_meters ASC
      LIMIT $${limitIdx}
    `;

    const result = await query<AssetRowWithDistance>(sql, queryParams);
    return result.rows.map(mapRowWithDistance);
  }
}

export const assetRepository = new AssetRepository();
