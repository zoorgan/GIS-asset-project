# GIS Asset Management System

Full-stack application for managing spatial assets built with Angular frontend and Node.js (PostgreSQL/PostGIS) backend.

## Key Decisions & Assumptions

### Technical Decisions
- Monorepo structure containing both `gis-asset-frontend` and `gis-asset-backend` for streamlined CI/CD orchestration.
- Customized PrimeNG dialog UI components using SCSS glassmorphism and Plus Jakarta Sans typography.
- GitHub Actions workflow (`evaluate.yml`) configured for automated headless Chromium testing on Linux Ubuntu instances.
- Environment isolation keeping `.env` git-ignored while maintaining `.env.example` as a public structure template.

### Assumptions
- PostgreSQL database with PostGIS extension is installed and running locally.
- Node.js (v20+) and Angular CLI are installed in the local environment.

## Setup & Execution

Run Backend:
cd gis-asset-backend && npm install && cp .env.example .env && npm run dev

Run Frontend:
cd gis-asset-frontend && npm install && ng serve

Run Unit Tests:
cd gis-asset-frontend && npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox

## Author
Developed by Ahmed Selim Mohammedin
