# GIS Asset Management & Spatial Search — Frontend

Angular (standalone components + signals) frontend, using Leaflet for
mapping and PrimeNG/PrimeFlex for UI, talking to the Node/Express/PostGIS
backend in `../gis-asset-backend`.

## Run

```bash
npm install
npm start          # ng serve, http://localhost:4200
npm run build      # production build -> dist/gis-asset-frontend
```

The backend must be running and reachable at the URL configured in
`src/environments/environment.ts` (defaults to `http://localhost:4000/api/v1`).

## Architecture

```
src/
  main.ts                    bootstraps AppComponent with appConfig
  app/app.config.ts          zone change detection, animations (PrimeNG dep),
                              HttpClient + JWT interceptor
  app/app.component.ts       root shell, renders the workspace full-viewport

  app/core/
    models/                  Asset, ApiResponse, Auth — mirror the backend's wire shapes
    services/asset.service.ts   typed HTTP boundary (list/get/create/update/delete/spatialSearch)
    state/asset.store.ts        signal-based store: filters, selection, spatial search —
                                 the single source of truth the map and list both bind to
    utils/asset-format.util.ts  shared distance formatting/type-guard
    interceptors/auth.interceptor.ts   attaches JWT bearer token to API requests

  app/features/
    map/asset-map.component.ts      Leaflet map: diffed markers, cached icons,
                                     dynamic popups, search-radius circle, full teardown
    asset-list/                     PrimeNG table + filter/spatial-search controls + details dialog
    workspace/asset-workspace.component.ts   PrimeFlex split-screen layout composing the above

  styles/leaflet-assets.scss  global styles for Leaflet's DOM-injected markup
                               (pins/popups) — registered in angular.json, since
                               Leaflet bypasses Angular's view encapsulation
```

## US-004 sync mechanism

Map and list never talk to each other directly. Both read/write
`AssetStore.selectedAssetId` — a marker click and a table-row click both
call `store.selectAsset(id)`, and each side's own signal effect reacts to
that one shared signal (map: fly-to + open popup; table: scroll-into-view +
highlight). This guarantees the two views cannot disagree about what's
selected.

## Verified

- `npx tsc --noEmit` — zero errors
- `ng build` (development) — zero errors, full AOT template compilation
- `ng build --configuration production` — zero errors, zero warnings
