--
-- PostgreSQL database dump
--

\restrict OD7SPgezat58XN1grVPJaGh4vmcXn4vZY9lS3ztCK4CRn0LoFZNMzkDM8adxsgo

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: asset_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.asset_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE'
);


ALTER TYPE public.asset_status OWNER TO postgres;

--
-- Name: asset_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.asset_type AS ENUM (
    'WATER_VALVE',
    'ELECTRIC_POLE',
    'MANHOLE',
    'FIRE_HYDRANT',
    'STREET_LIGHT',
    'SUBSTATION',
    'CELL_TOWER',
    'OTHER'
);


ALTER TYPE public.asset_type OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'VIEWER'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: fn_assets_sync_geom(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_assets_sync_geom() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_assets_sync_geom() OWNER TO postgres;

--
-- Name: fn_users_touch_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_users_touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_users_touch_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    type public.asset_type NOT NULL,
    status public.asset_status DEFAULT 'ACTIVE'::public.asset_status NOT NULL,
    description text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    geom public.geography(Point,4326) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assets_latitude_check CHECK (((latitude >= ('-90'::integer)::double precision) AND (latitude <= (90)::double precision))),
    CONSTRAINT assets_longitude_check CHECK (((longitude >= ('-180'::integer)::double precision) AND (longitude <= (180)::double precision)))
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    filename text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(64) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'VIEWER'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (id, name, type, status, description, latitude, longitude, geom, metadata, created_by, created_at, updated_at) FROM stdin;
2b8db267-e141-4d12-8aca-80abc127789f	Main St Fire Hydrant #12	FIRE_HYDRANT	ACTIVE	Standard 4-inch hydrant	30.0444	31.2357	0101000020E6100000CEAACFD5563C3F4041F163CC5D0B3E40	{"flowRateLps": 15}	\N	2026-08-26 19:58:48.259322+03	2026-08-26 19:58:48.259322+03
b4e9b48b-964a-4722-952e-3ebc64a72810	Manhole MH-118	MANHOLE	ACTIVE	Sewer access point	30.041	31.238	0101000020E6100000B0726891ED3C3F40D122DBF97E0A3E40	{}	\N	2026-08-26 19:58:48.259322+03	2026-08-26 19:58:48.259322+03
453b1a44-7833-422c-9e50-d1314eab1b15	Street Light SL-045	STREET_LIGHT	ACTIVE	LED, 150W	30.046	31.242	0101000020E6100000CBA145B6F33D3F40B29DEFA7C60B3E40	{"wattage": 150}	\N	2026-08-26 19:58:48.259322+03	2026-08-26 19:58:48.259322+03
d84cc43b-410b-4c83-8ecf-86e24761706d	Cell Tower Nile View	CELL_TOWER	ACTIVE	5G capable macro tower	30.053	31.235	0101000020E61000005C8FC2F5283C3F4021B07268910D3E40	{"heightM": 45}	\N	2026-08-26 19:58:48.259322+03	2026-08-26 19:58:48.259322+03
d2325152-64ac-40e0-83e5-bd66448ad56c	Fire Hydrant Corniche #3	FIRE_HYDRANT	ACTIVE	Coastal road hydrant	30.052	31.244	0101000020E61000005839B4C8763E3F405A643BDF4F0D3E40	{"flowRateLps": 12}	\N	2026-08-26 19:58:48.259322+03	2026-08-26 19:58:48.259322+03
bfb866d9-afc2-47b3-9ff8-0dc01ecb4d70	Water Valve Industrial Zone	WATER_VALVE	ACTIVE	High-capacity industrial valve	30.035	31.228	0101000020E6100000EE7C3F355E3A3F40295C8FC2F5083E40	{"diameterMm": 350}	\N	2026-08-26 19:58:48.259322+03	2026-08-26 19:58:48.259322+03
2cdd6b26-a97c-4008-9f7b-2a3f7a986301	Manhole MH-202	MANHOLE	ACTIVE	Storm drain access	30.047	31.236	0101000020E610000023DBF97E6A3C3F4079E92631080C3E40	{}	\N	2026-08-26 19:58:48.259322+03	2026-08-26 19:58:48.259322+03
f04bc8d9-93bf-4e25-82a6-4fda89c4ac65	Downtown Substation A	SUBSTATION	ACTIVE	11kV distribution substation	30.05	31.24	0101000020E61000003D0AD7A3703D3F40CDCCCCCCCC0C3E40	{"capacityKva": 500}	\N	2026-08-26 19:58:48.259322+03	2026-08-27 00:40:24.401037+03
203604d2-bce4-4d41-88d4-c6453b4c3a15	Quler Sro	ELECTRIC_POLE	ACTIVE	Substation	30.04871804021059	31.25642538070679	0101000020E610000001000018A5413F40016E15C9780C3E40	{}	1caccdbd-5c3e-4d7e-a059-7a880d9c30a0	2026-08-27 01:04:18.499888+03	2026-08-27 01:04:18.499888+03
58fb2b91-a652-4d52-afde-152b5c7278c6	مستشفي البلد	OTHER	ACTIVE	مستشفي	30.04871804021059	31.25642538070679	0101000020E610000001000018A5413F40016E15C9780C3E40	{}	1caccdbd-5c3e-4d7e-a059-7a880d9c30a0	2026-08-27 01:12:27.648281+03	2026-08-27 01:12:27.648281+03
95f7953b-c3fc-41d5-8ad2-ab74a719a40b	Electric Pole EP-231	ELECTRIC_POLE	ACTIVE	Damaged, pending replacement	30.0395	31.233	0101000020E6100000CFF753E3A53B3F40273108AC1C0A3E40	{}	\N	2026-08-26 19:58:48.259322+03	2026-08-28 03:07:35.154367+03
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (filename, applied_at) FROM stdin;
001_init.sql	2026-08-26 19:58:50.122309+03
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role, created_at, updated_at) FROM stdin;
cb136f69-f9e5-41c3-865b-6465014212ce	zoorgan	$2b$10$QR9M5r4QRevMl0nOPjxm4ubToEervWCQapd9cRa599U46rwleXgeO	VIEWER	2026-08-26 21:30:18.37257+03	2026-08-26 21:30:18.37257+03
0abdf2c1-fc8e-4b66-a0f7-1d4145279b94	ahmed	$2b$10$KE4kpXh9erwHIfoGXq6fmuzPTw3TG7rsaqy49V0Du62OGdAVuJLZm	VIEWER	2026-08-26 23:11:24.164857+03	2026-08-26 23:11:24.164857+03
1caccdbd-5c3e-4d7e-a059-7a880d9c30a0	admin	$2b$10$rkGIirARkyb.RqmHn9.EF.gOP3yZXua/HwhAvB.PkJE884Qa3seAa	ADMIN	2026-08-26 19:58:48.259322+03	2026-08-26 23:50:04.844504+03
d39f5606-53ab-4c6d-89c2-fec230a6c503	ahmeed	$2b$10$poRvF4Z4Z//FkoO3dctObOptE3k9uMoGaELCchIw5Y6icsy1W6mOK	VIEWER	2026-08-27 22:40:57.557506+03	2026-08-27 22:40:57.557506+03
\.


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_assets_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_geom ON public.assets USING gist (geom);


--
-- Name: idx_assets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_status ON public.assets USING btree (status);


--
-- Name: idx_assets_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_type ON public.assets USING btree (type);


--
-- Name: assets trg_assets_sync_geom; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_assets_sync_geom BEFORE INSERT OR UPDATE OF latitude, longitude ON public.assets FOR EACH ROW EXECUTE FUNCTION public.fn_assets_sync_geom();


--
-- Name: users trg_users_touch_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_touch_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_users_touch_updated_at();


--
-- Name: assets assets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict OD7SPgezat58XN1grVPJaGh4vmcXn4vZY9lS3ztCK4CRn0LoFZNMzkDM8adxsgo

