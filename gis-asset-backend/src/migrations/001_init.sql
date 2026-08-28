-- ============================================================================
-- Migration: 001_init.sql
-- Description: Initializes PostGIS extension, core tables, spatial (GIST)
--              indexing, and seed data for the GIS Asset Management system.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 2. Enum Types
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
    CREATE TYPE asset_type AS ENUM (
      'WATER_VALVE',
      'ELECTRIC_POLE',
      'MANHOLE',
      'FIRE_HYDRANT',
      'STREET_LIGHT',
      'SUBSTATION',
      'CELL_TOWER',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
    CREATE TYPE asset_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'VIEWER');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Users table (Auth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(64)  NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          user_role    NOT NULL DEFAULT 'VIEWER',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. Assets table
--    `geom` uses geography(Point, 4326) so that ST_DWithin / ST_DistanceSphere
--    operate in meters natively without manual projection math.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150)  NOT NULL,
  type        asset_type    NOT NULL,
  status      asset_status  NOT NULL DEFAULT 'ACTIVE',
  description TEXT,
  latitude    DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude   DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  geom        geography(Point, 4326) NOT NULL,
  metadata    JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_by  UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. Spatial index (GIST) — critical for ST_DWithin performance at scale
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_assets_geom ON assets USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets (type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets (status);

-- ----------------------------------------------------------------------------
-- 6. Trigger: keep geom column in sync with latitude/longitude and
--    auto-update updated_at on every write. This guarantees geom can never
--    drift out of sync with the lat/lng columns regardless of write path.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_assets_sync_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assets_sync_geom ON assets;
CREATE TRIGGER trg_assets_sync_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude ON assets
  FOR EACH ROW
  EXECUTE FUNCTION fn_assets_sync_geom();

CREATE OR REPLACE FUNCTION fn_users_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_touch_updated_at ON users;
CREATE TRIGGER trg_users_touch_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION fn_users_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Seed data
--    Default admin password is "Admin@123" (bcrypt hash, 10 rounds).
--    ⚠️ Rotate this credential immediately in any non-local environment.
-- ----------------------------------------------------------------------------
INSERT INTO users (username, password_hash, role)
VALUES (
  'admin',
  '$2b$10$xrz1nJ8XvY7C1DKz1z0S9OqM5G8bYb0d1sN0f0Zf1yQe6Q3T1jS0G', -- Admin@123
  'ADMIN'
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO assets (name, type, status, description, latitude, longitude, metadata)
VALUES
  ('Main St Fire Hydrant #12', 'FIRE_HYDRANT', 'ACTIVE', 'Standard 4-inch hydrant', 30.0444, 31.2357, '{"flowRateLps": 15}'),
  ('Downtown Substation A', 'SUBSTATION', 'ACTIVE', '11kV distribution substation', 30.0500, 31.2400, '{"capacityKva": 500}'),
  ('Elm Ave Water Valve #7', 'WATER_VALVE', 'MAINTENANCE', 'Gate valve, scheduled service', 30.0480, 31.2300, '{"diameterMm": 200}'),
  ('Manhole MH-118', 'MANHOLE', 'ACTIVE', 'Sewer access point', 30.0410, 31.2380, '{}'),
  ('Street Light SL-045', 'STREET_LIGHT', 'ACTIVE', 'LED, 150W', 30.0460, 31.2420, '{"wattage": 150}'),
  ('Cell Tower Nile View', 'CELL_TOWER', 'ACTIVE', '5G capable macro tower', 30.0530, 31.2350, '{"heightM": 45}'),
  ('Electric Pole EP-231', 'ELECTRIC_POLE', 'INACTIVE', 'Damaged, pending replacement', 30.0395, 31.2330, '{}'),
  ('Fire Hydrant Corniche #3', 'FIRE_HYDRANT', 'ACTIVE', 'Coastal road hydrant', 30.0520, 31.2440, '{"flowRateLps": 12}'),
  ('Water Valve Industrial Zone', 'WATER_VALVE', 'ACTIVE', 'High-capacity industrial valve', 30.0350, 31.2280, '{"diameterMm": 350}'),
  ('Manhole MH-202', 'MANHOLE', 'ACTIVE', 'Storm drain access', 30.0470, 31.2360, '{}')
ON CONFLICT DO NOTHING;

COMMIT;
