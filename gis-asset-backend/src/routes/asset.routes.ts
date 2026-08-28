import { Router } from 'express';
import { assetController } from '../controllers/asset.controller';
import {
  assetIdValidator,
  createAssetValidator,
  listAssetsValidator,
  spatialSearchValidator,
  updateAssetValidator,
} from '../dto/asset.dto';
import { validateRequest } from '../middleware/validate.middleware';
import { authGuard, requireRole } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @openapi
 * /assets:
 *   get:
 *     tags: [Assets]
 *     summary: List assets (optionally filtered by type/status, paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated list of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Asset' }
 *       401:
 *         description: Missing/invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get('/', authGuard, listAssetsValidator, validateRequest, asyncHandler(assetController.list));

/**
 * @openapi
 * /assets/spatial-search:
 *   get:
 *     tags: [Assets]
 *     summary: Radius-based spatial search using PostGIS ST_DWithin / ST_DistanceSphere
 *     description: >
 *       Returns assets within `radius` meters of (`lat`, `lng`), sorted by
 *       ascending distance. Distance is computed server-side by PostGIS and
 *       appended to each result as `distanceMeters`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, format: double, example: 30.0444 }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, format: double, example: 31.2357 }
 *       - in: query
 *         name: radius
 *         required: true
 *         description: Search radius in meters
 *         schema: { type: number, example: 2000 }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200:
 *         description: Assets within radius, sorted by distance ascending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Asset' }
 *       400:
 *         description: Invalid lat/lng/radius
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       401:
 *         description: Missing/invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get(
  '/spatial-search',
  authGuard,
  spatialSearchValidator,
  validateRequest,
  asyncHandler(assetController.spatialSearch)
);

/**
 * @openapi
 * /assets/{id}:
 *   get:
 *     tags: [Assets]
 *     summary: Get a single asset by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Asset found
 *       401:
 *         description: Missing/invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get('/:id', authGuard, assetIdValidator, validateRequest, asyncHandler(assetController.getById));

/**
 * @openapi
 * /assets:
 *   post:
 *     tags: [Assets]
 *     summary: Create a new asset (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, latitude, longitude]
 *             properties:
 *               name: { type: string }
 *               type: { type: string }
 *               status: { type: string }
 *               description: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               metadata: { type: object }
 *     responses:
 *       201:
 *         description: Asset created
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       401:
 *         description: Missing/invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       403:
 *         description: Insufficient role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post(
  '/',
  authGuard,
  requireRole('ADMIN'),
  createAssetValidator,
  validateRequest,
  asyncHandler(assetController.create)
);

/**
 * @openapi
 * /assets/{id}:
 *   put:
 *     tags: [Assets]
 *     summary: Update an existing asset (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               type: { type: string }
 *               status: { type: string }
 *               description: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               metadata: { type: object }
 *     responses:
 *       200:
 *         description: Asset updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing/invalid token
 *       403:
 *         description: Insufficient role
 *       404:
 *         description: Asset not found
 */
router.put(
  '/:id',
  authGuard,
  requireRole('ADMIN'),
  updateAssetValidator,
  validateRequest,
  asyncHandler(assetController.update)
);

/**
 * @openapi
 * /assets/{id}:
 *   delete:
 *     tags: [Assets]
 *     summary: Delete an asset (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Asset deleted
 *       401:
 *         description: Missing/invalid token
 *       403:
 *         description: Insufficient role
 *       404:
 *         description: Asset not found
 */
router.delete(
  '/:id',
  authGuard,
  requireRole('ADMIN'),
  assetIdValidator,
  validateRequest,
  asyncHandler(assetController.delete)
);

export default router;
