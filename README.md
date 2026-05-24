# Order Dashboard Pet Project

Order Dashboard is a React/TypeScript pet project that demonstrates frontend architecture, data visualization, performance optimization, concurrency patterns, metaprogramming utilities, and a small Express backend API.

## Live Demo

Frontend:

https://order-dashboard-pet-project.vercel.app

Backend API:

https://order-dashboard-api.onrender.com

Health check:

https://order-dashboard-api.onrender.com/api/health

Orders API:

https://order-dashboard-api.onrender.com/api/orders

> The backend is hosted on Render Free plan. It can spin down after inactivity, so the first request after a pause may take some time.

## Tech Stack

### Frontend

- React
- TypeScript
- React Router
- Webpack
- Recharts
- React Leaflet / Leaflet
- SCSS

### Backend

- Node.js
- Express
- TypeScript
- In-memory mocked data store
- CORS
- Bearer token protected endpoint

## Main Features

### Dashboard

Displays order statistics and charts based on orders data.

### Orders

Shows orders loaded from the backend API.

### Create Order

Allows creating a new order through the Express backend.

### Analytics

Demonstrates data visualization with charts and map markers.

The analytics module prepares raw orders data through a separate transformation layer and displays:

- orders by status;
- total amount by city;
- top city;
- map markers with city-level order data.

### Performance Demo

Compares naive and optimized filtering algorithms.

The page demonstrates a functional Strategy Pattern approach:

- `runNaive` uses a simple `Array.includes` based algorithm;
- `runOptimized` uses `Set` / `Map` based checks;
- `measureAvg` runs benchmarks multiple times and calculates average execution time.

### Optimization / Performance Advanced

Demonstrates frontend optimization and async request handling patterns, including:

- latest-only requests;
- singleflight / request deduplication;
- avoiding stale UI updates.

### Security Demo

Demonstrates public and protected backend endpoints.

Backend protected route:

```txt
GET /api/secure/profile
```

requires:

```txt
Authorization: Bearer <API_TOKEN>
```

### Metaprogramming

Includes utility examples such as:

- typed event emitter;
- proxy-based logging;
- memoization;
- typed utility patterns.

## Project Structure

```txt
.
├── public
├── server
│   ├── app.ts
│   ├── auth.ts
│   ├── index.ts
│   ├── routes
│   ├── store
│   └── validators
├── src
│   ├── api
│   ├── features
│   ├── pages
│   └── shared
├── webpack
├── .env.development
├── .env.production
├── package.json
└── README.md
```

## Backend API

### Health

```txt
GET /api/health
```

Response:

```json
{
  "ok": true
}
```

### Get Orders

```txt
GET /api/orders
```

Optional query params:

```txt
/api/orders?status=new&status=completed
```

### Create Order

```txt
POST /api/orders
```

Example body:

```json
{
  "createdAt": "2026-02-01T10:15:00.000Z",
  "status": "new",
  "amount": 500,
  "city": "Kyiv",
  "lat": 50.4501,
  "lng": 30.5234
}
```

### Public Security Endpoint

```txt
GET /api/public
```

### Protected Security Endpoint

```txt
GET /api/secure/profile
```

Requires Bearer token:

```txt
Authorization: Bearer <API_TOKEN>
```

## Environment Variables

### Backend

Used by the Express backend:

```env
API_TOKEN=super-secret-token
```

### Frontend Development

`.env.development`

```env
API_URL=http://localhost:4000
FEATURE_FLAG_HEAVY=true
```

### Frontend Production

`.env.production`

```env
API_URL=https://order-dashboard-api.onrender.com
FEATURE_FLAG_HEAVY=false
```

The frontend uses `API_URL` to call the deployed backend in production.

## Local Development

Install dependencies:

```sh
npm install
```

Start backend:

```sh
npm run server:start
```

Backend runs on:

```txt
http://localhost:4000
```

Start frontend:

```sh
npm run start
```

Frontend runs on:

```txt
http://localhost:3000
```

Or start both frontend and backend:

```sh
npm run start:full
```

## Production Build

Create production build:

```sh
npm run build
```

The production files are generated in:

```txt
dist/
```

Preview production build locally:

```sh
npm run preview
```

Preview runs on:

```txt
http://localhost:3001
```

## Deployment

The application is deployed as two separate services.

### Frontend

Hosted on Vercel.

Build settings:

```txt
Framework Preset: Other
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Production environment variable:

```env
API_URL=https://order-dashboard-api.onrender.com
```

### Backend

Hosted on Render as a Node Web Service.

Render settings:

```txt
Runtime: Node
Build Command: npm install
Start Command: npm run server:start
```

Environment variable:

```env
API_TOKEN=super-secret-token
```

## Scripts

```txt
npm run start
```

Starts the Webpack development server.

```txt
npm run start:full
```

Starts backend and frontend together.

```txt
npm run server:start
```

Starts the Express backend.

```txt
npm run build
```

Creates a production frontend build.

```txt
npm run preview
```

Builds the frontend and serves the production build locally.

```txt
npm run lint
```

Runs ESLint.

```txt
npm run lint:fix
```

Runs ESLint with autofix.

```txt
npm run format
```

Formats files with Prettier.

## What This Project Demonstrates

- React application structure with TypeScript.
- Custom Webpack build configuration.
- Frontend and backend integration.
- Production deployment with Vercel and Render.
- Environment-based API configuration.
- Data visualization with charts and maps.
- Algorithm performance comparison.
- Request deduplication and latest-only async handling.
- Basic backend validation and protected routes.
- Clean separation between UI, data transformation, API client, and backend routes.
