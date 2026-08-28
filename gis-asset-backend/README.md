# GIS Asset Management & Spatial Search — Backend

Node.js + Express + TypeScript API backed by PostgreSQL/PostGIS, implementing
Controller → Service → Repository layered architecture.

## Setup

```bash
cp .env.example .env        # edit DB credentials as needed
npm install
npm run migrate             # applies src/migrations/*.sql (idempotent)
npm run dev                 # starts on http://localhost:4000
```

Swagger UI: `http://localhost:4000/api-docs`
Raw OpenAPI spec: `http://localhost:4000/api-docs.json`

## Default credentials (seeded)

```
username: admin
password: Admin@123
```

## Key endpoints

| Method | Path                                  | Auth  | Description                          |
|--------|----------------------------------------|-------|---------------------------------------|
| POST   | /api/v1/auth/login                     | none  | Returns JWT                          |
| GET    | /api/v1/assets                         | none  | List assets (filter/paginate)        |
| GET    | /api/v1/assets/spatial-search          | none  | ST_DWithin/ST_DistanceSphere search  |
| GET    | /api/v1/assets/:id                     | none  | Get one asset                        |
| POST   | /api/v1/assets                         | ADMIN | Create asset                         |
| PUT    | /api/v1/assets/:id                     | ADMIN | Update asset                         |
| DELETE | /api/v1/assets/:id                     | ADMIN | Delete asset                         |

## Example: spatial search

```
GET /api/v1/assets/spatial-search?lat=30.0444&lng=31.2357&radius=2000
```

## Architecture

```
src/
  config/       env, db pool, swagger, migration runner
  migrations/   raw SQL (PostGIS ext, tables, GIST index, seed data)
  models/       TypeScript domain interfaces
  dto/          express-validator validation chains
  repositories/ raw parameterized SQL only (SRP boundary)
  services/     business logic, depends on repositories via interface
  controllers/  HTTP boundary, depends on services
  routes/       Express routers + OpenAPI JSDoc annotations
  middleware/   authGuard, requireRole, validateRequest, errorHandler
  utils/        ApiError, asyncHandler, response envelope
```
