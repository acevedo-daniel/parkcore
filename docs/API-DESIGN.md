# API Design

## Error Contract

All error responses use:

```json
{ "error": true, "message": "Human-readable message" }
```

Expected domain failures use `AppError` subclasses and return `4xx` responses. Unexpected failures return `500 Internal Server Error`.

## Authentication

- Scheme: Bearer JWT
- Signing: HS256 through `jose`
- Password hashing: Argon2
- Auth middleware sets `req.user.id`

Authentication authorizes parking owners. All authenticated users currently have the same capabilities: they may create parkings and may manage vehicles and bookings only for parkings they own. Public endpoints expose parking discovery and reviews; reviews do not identify an authenticated user.

## Validation

All external input is validated through:

```typescript
validateRequest({ params, query, body });
```

Schemas are colocated with their feature modules and inferred with `z.infer`.

## Pagination

Paginated responses use:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Rate Limiting

Rate limiting is applied to:

- `POST /auth/register`
- `POST /auth/login`
- `POST /reviews/parking/:parkingId`

Configuration:

| Variable                    | Default  |
| --------------------------- | -------- |
| `AUTH_RATE_LIMIT_MAX`       | `15`     |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` |

## OpenAPI

- UI: `/docs`
- JSON: `/openapi.json`
- Production docs require `ENABLE_API_DOCS=true`
- The generated OpenAPI document is the endpoint-level API contract. This document deliberately does not duplicate every operation.

## Domain Terminology

In the running API, a `Booking` is created by the `check-in` operation and represents a vehicle stay, rather than a customer reservation made in advance. An active stay has status `CONFIRMED`; checkout or cancellation finalizes it. `Vehicle` records are scoped to a parking facility and may include the visiting customer's contact details.

These names are retained in the API for compatibility. Their desired product meaning is recorded as an open decision in [PROJECT.md](PROJECT.md).
