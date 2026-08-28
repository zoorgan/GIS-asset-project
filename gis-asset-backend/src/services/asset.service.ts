import { AssetRepository, assetRepository } from '../repositories/asset.repository';
import {
  Asset,
  AssetFilter,
  AssetWithDistance,
  CreateAssetInput,
  SpatialSearchParams,
  UpdateAssetInput,
} from '../models/asset.model';
import { ApiError } from '../utils/ApiError';

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}


export class AssetService {
  constructor(private readonly repository: AssetRepository = assetRepository) {}

  async list(filter: AssetFilter, page = 1, pageSize = 50): Promise<PaginatedResult<Asset>> {
    const { items, total } = await this.repository.findAll(filter, page, pageSize);
    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getById(id: string): Promise<Asset> {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw ApiError.notFound(`Asset with id ${id} was not found`);
    }
    return asset;
  }

  async create(input: CreateAssetInput): Promise<Asset> {
    this.assertValidCoordinates(input.latitude, input.longitude);
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateAssetInput): Promise<Asset> {
    if (input.latitude !== undefined || input.longitude !== undefined) {
      const existing = await this.getById(id);
      this.assertValidCoordinates(
        input.latitude ?? existing.latitude,
        input.longitude ?? existing.longitude
      );
    }

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw ApiError.notFound(`Asset with id ${id} was not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw ApiError.notFound(`Asset with id ${id} was not found`);
    }
  }


  async spatialSearch(params: SpatialSearchParams): Promise<AssetWithDistance[]> {
    this.assertValidCoordinates(params.latitude, params.longitude);

    if (params.radiusMeters <= 0) {
      throw ApiError.validation('radius must be a positive number of meters');
    }

    return this.repository.spatialSearch(params);
  }

  private assertValidCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw ApiError.validation('latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw ApiError.validation('longitude must be between -180 and 180');
    }
  }
}

export const assetService = new AssetService();
