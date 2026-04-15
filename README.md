# Vehicle Telematics API

A production-grade REST API for connected vehicle telemetry, fault management, and notifications. Built with Node.js, Express, and a microservices architecture.

## Live API

- **Base URL:** https://vehicle-telematics-api-production-cc3b.up.railway.app
- **Swagger Docs:** https://vehicle-telematics-api-production-cc3b.up.railway.app/api-docs

## Architecture

- **Monolith** — single Express server with 13 endpoints
- **Microservices** — telemetry, fault, notification services
- **API Gateway** — rate limiting, API key authentication
- **Docker** — containerised with docker-compose orchestration
- **Kubernetes** — deployment manifests for all services
- **CI/CD** — GitHub Actions pipeline

## Tech Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Runtime          | Node.js                 |
| Framework        | Express.js              |
| Documentation    | Swagger/OpenAPI 3.0     |
| Containerisation | Docker + docker-compose |
| Orchestration    | Kubernetes              |
| CI/CD            | GitHub Actions          |
| Deployment       | Railway                 |

## API Endpoints

### Telemetry

- `GET /api/telemetry/:vehicleId` — Latest snapshot
- `POST /api/telemetry/:vehicleId` — Ingest data
- `GET /api/telemetry/:vehicleId/history` — Historical data
- `GET /api/telemetry/:vehicleId/stream` — Live SSE stream

### Faults

- `GET /api/faults/:vehicleId` — Active fault codes
- `GET /api/faults/:vehicleId/:dtcCode` — Single fault detail
- `PUT /api/faults/:vehicleId/:dtcCode/resolve` — Resolve fault
- `POST /api/faults/:vehicleId/scan` — Trigger diagnostic scan
- `GET /api/faults/severity/:level` — Faults by severity

### Notifications

- `GET /api/notifications/:vehicleId` — All notifications
- `POST /api/notifications/critical` — Trigger critical alert
- `PUT /api/notifications/:id/acknowledge` — Acknowledge

## Automotive Domain Context

This API mirrors real SDV backend architecture:

- Telemetry service → OTA data ingestion pipeline
- Fault service → AUTOSAR Diagnostic Event Manager (DEM)
- Notification service → Diagnostic Communication Manager (DCM)
- API Gateway → Service-oriented architecture (SOME/IP pattern)

## Author

Vishwas H S — Automotive Product Leader | SDV | ePowertrain | AUTOSAR
GitHub: https://github.com/Vish88git
