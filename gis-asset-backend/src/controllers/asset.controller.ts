import { Request, Response } from 'express';
import { AssetService, assetService } from '../services/asset.service';
import { sendSuccess } from '../utils/apiResponse';
import { AssetFilter, AssetType, AssetStatus } from '../models/asset.model';


export class AssetController {
  constructor(private readonly service: AssetService = assetService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const filter: AssetFilter = {
      type: req.query.type as AssetType | undefined,
      status: req.query.status as AssetStatus | undefined,
    };
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 50;

    const result = await this.service.list(filter, page, pageSize);
    sendSuccess(res, result.items, 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const asset = await this.service.getById(req.params.id);
    sendSuccess(res, asset);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const asset = await this.service.create({
      name: req.body.name,
      type: req.body.type,
      status: req.body.status,
      description: req.body.description ?? null,
      latitude: Number(req.body.latitude),
      longitude: Number(req.body.longitude),
      metadata: req.body.metadata,
      createdBy: req.user?.sub ?? null,
    });
    sendSuccess(res, asset, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const asset = await this.service.update(req.params.id, {
      name: req.body.name,
      type: req.body.type,
      status: req.body.status,
      description: req.body.description,
      latitude: req.body.latitude !== undefined ? Number(req.body.latitude) : undefined,
      longitude: req.body.longitude !== undefined ? Number(req.body.longitude) : undefined,
      metadata: req.body.metadata,
    });
    sendSuccess(res, asset);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  };

  spatialSearch = async (req: Request, res: Response): Promise<void> => {
    const results = await this.service.spatialSearch({
      latitude: Number(req.query.lat),
      longitude: Number(req.query.lng),
      radiusMeters: Number(req.query.radius),
      type: req.query.type as AssetType | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    sendSuccess(res, results, 200, {
      count: results.length,
      center: { lat: Number(req.query.lat), lng: Number(req.query.lng) },
      radiusMeters: Number(req.query.radius),
    });
  };
}

export const assetController = new AssetController();
