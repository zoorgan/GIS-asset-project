import { body, param, query } from 'express-validator';
import { ASSET_STATUSES, ASSET_TYPES } from '../models/asset.model';


export const createAssetValidator = [
  body('name')
    .isString().withMessage('name must be a string')
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('name must be between 2 and 150 characters'),

  body('type')
    .isString()
    .isIn(ASSET_TYPES).withMessage(`type must be one of: ${ASSET_TYPES.join(', ')}`),

  body('status')
    .optional()
    .isString()
    .isIn(ASSET_STATUSES).withMessage(`status must be one of: ${ASSET_STATUSES.join(', ')}`),

  body('description')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 2000 }).withMessage('description must be at most 2000 characters'),

  body('latitude')
    .exists({ checkFalsy: false }).withMessage('latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),

  body('longitude')
    .exists({ checkFalsy: false }).withMessage('longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180'),

  body('metadata')
    .optional()
    .isObject().withMessage('metadata must be a JSON object'),
];

export const updateAssetValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID'),

  body('name')
    .optional()
    .isString().trim()
    .isLength({ min: 2, max: 150 }).withMessage('name must be between 2 and 150 characters'),

  body('type')
    .optional()
    .isString()
    .isIn(ASSET_TYPES).withMessage(`type must be one of: ${ASSET_TYPES.join(', ')}`),

  body('status')
    .optional()
    .isString()
    .isIn(ASSET_STATUSES).withMessage(`status must be one of: ${ASSET_STATUSES.join(', ')}`),

  body('description')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 2000 }),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180'),

  body('metadata')
    .optional()
    .isObject().withMessage('metadata must be a JSON object'),
];

export const assetIdValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

export const listAssetsValidator = [
  query('type').optional().isString().isIn(ASSET_TYPES),
  query('status').optional().isString().isIn(ASSET_STATUSES),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 200 }).toInt(),
];

export const spatialSearchValidator = [
  query('lat')
    .exists().withMessage('lat is required')
    .isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),

  query('lng')
    .exists().withMessage('lng is required')
    .isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),

  query('radius')
    .exists().withMessage('radius is required')
    .isFloat({ gt: 0, lt: 200_000 }).withMessage('radius must be a positive number of meters (< 200000)'),

  query('type').optional().isString().isIn(ASSET_TYPES),

  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
];
