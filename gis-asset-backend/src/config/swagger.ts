import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const swaggerDefinition: swaggerJSDoc.SwaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'GIS Asset Management & Spatial Search API',
    version: '1.0.0',
    description:
      'Production-grade API for managing geospatial assets, powered by PostgreSQL/PostGIS. ' +
      'Supports CRUD operations (admin-protected) and radius-based spatial search using ' +
      'ST_DWithin / ST_DistanceSphere.',
  },
  servers: [
    { url: '/api/v1', description: 'Base API path (versioned)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Asset: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Main St Fire Hydrant #12' },
          type: {
            type: 'string',
            enum: [
              'WATER_VALVE', 'ELECTRIC_POLE', 'MANHOLE', 'FIRE_HYDRANT',
              'STREET_LIGHT', 'SUBSTATION', 'CELL_TOWER', 'OTHER',
            ],
          },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] },
          description: { type: 'string', nullable: true },
          latitude: { type: 'number', format: 'double', example: 30.0444 },
          longitude: { type: 'number', format: 'double', example: 31.2357 },
          metadata: { type: 'object' },
          distanceMeters: {
            type: 'number',
            nullable: true,
            description: 'Only populated by the spatial-search endpoint.',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export const swaggerSpec = swaggerJSDoc({
  swaggerDefinition,
  apis: [
    path.posix.join(__dirname.replace(/\\/g, '/'), '..', 'routes', '*.ts'),
    path.posix.join(__dirname.replace(/\\/g, '/'), '..', 'routes', '*.js'),
  ],
});
