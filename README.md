# Vehicle Telematics API

A production-grade REST API for connected vehicle telemetry, fault management, and notifications. Built with Node.js, Express, PostgreSQL, and a microservices architecture.

## Live API

- **Base URL:** https://vehicle-telematics-api-production-cc3b.up.railway.app
- **Swagger Docs:** https://vehicle-telematics-api-production-cc3b.up.railway.app/api-docs

## Connected Frontend

- **Vehicle Health Monitor V2:** https://vehicle-health-monitor-v2.vercel.app
- Dashboard gauges connected to live Railway API via secure Vercel proxy

## Architecture

- **Monolith** — single Express server with 13 endpoints
- **Microservices** — telemetry, fault, notification services
- **API Gateway** — rate limiting, API key authentication
- **Docker** — containerised with docker-compose orchestration
- **Kubernetes** — deployment manifests for all services
- **CI/CD** — GitHub Actions pipeline
- **Database** — PostgreSQL persistent storage for all services

## Tech Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Runtime          | Node.js                 |
| Framework        | Express.js              |
| Database         | PostgreSQL              |
| Documentation    | Swagger/OpenAPI 3.0     |
| Containerisation | Docker + docker-compose |
| Orchestration    | Kubernetes              |
| CI/CD            | GitHub Actions          |
| Deployment       | Railway                 |

## Database Schema

| Table             | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| notifications     | Critical fault alerts with acknowledgement state       |
| faults            | DTC fault codes with resolved state per vehicle        |
| telemetry_history | Time-series telemetry snapshots, LIMIT 100 most recent |

## API Endpoints

### Telemetry

- `GET /api/telemetry/:vehicleId` — Latest snapshot
- `POST /api/telemetry/:vehicleId` — Ingest data + persist to DB
- `GET /api/telemetry/:vehicleId/history` — Historical data from PostgreSQL
- `GET /api/telemetry/:vehicleId/stream` — Live SSE stream

### Faults

- `GET /api/faults/:vehicleId` — Active fault codes from PostgreSQL
- `GET /api/faults/:vehicleId/:dtcCode` — Single fault detail
- `PUT /api/faults/:vehicleId/:dtcCode/resolve` — Resolve fault in PostgreSQL
- `POST /api/faults/:vehicleId/scan` — Trigger diagnostic scan
- `GET /api/faults/severity/:level` — Faults by severity

### Notifications

- `GET /api/notifications/:vehicleId` — All notifications from PostgreSQL
- `POST /api/notifications/critical` — Trigger critical alert, persisted to DB
- `PUT /api/notifications/:id/acknowledge` — Acknowledge in PostgreSQL

## Automotive Domain Context

This API mirrors real SDV backend architecture:

- Telemetry service → OTA data ingestion pipeline
- Fault service → AUTOSAR Diagnostic Event Manager (DEM)
- Notification service → Diagnostic Communication Manager (DCM)
- API Gateway → Service-oriented architecture (SOME/IP pattern)
- PostgreSQL → Persistent fault memory (NvM equivalent)

## Author

Vishwas H S — Automotive Product Leader | SDV | ePowertrain | AUTOSAR
GitHub: https://github.com/Vish88git
