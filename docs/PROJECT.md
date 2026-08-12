# Project and Domain Map

## Phase 1: Domain Definition - Closed

**Status:** closed for ParkCore 1.0.

The decisions in this document are definitive domain decisions for version 1.0. They replace the earlier audit hypotheses. Phase 2 may implement them, but must not change their meaning without reopening domain definition.

## Product Scope

ParkCore is an operational management system for parking-facility owners and operators. It is not a marketplace.

Version 1.0 deliberately excludes:

- future reservations;
- registered customers;
- payments;
- employees; and
- complex role-based access control.

## Actors and Ownership

| Actor             | 1.0 responsibility                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `User`            | The authenticated parking owner/operator. Every user has the same capabilities; no new roles will be introduced. |
| `Parking`         | An operational facility owned by exactly one user.                                                               |
| Visiting customer | A non-authenticated real-world person represented only by optional contact data on their vehicle.                |

```text
User (owner/operator)
  └── Parking
        ├── Vehicle
        │     └── ParkingSession
        └── [Review: removed from the 1.0 product]
```

## Definitive Domain Model

### User

`User` represents the authenticated owner/operator. A user owns zero or more parkings, and every parking belongs to one user. No customer account, employee model, or additional role is part of 1.0.

### Parking

`Parking` represents one facility operated by its owner. It has an `isActive` lifecycle:

- `ACTIVE` (`isActive = true`) accepts new check-ins and is visible in public parking lists.
- `INACTIVE` (`isActive = false`) rejects new check-ins and is hidden from public parking lists.
- The owner can list and read both active and inactive parkings, and can deactivate or reactivate a parking.
- ParkCore 1.0 has no public hard-delete operation.

Capacity is the maximum number of concurrent `ParkingSession` records in `ACTIVE` status. ParkCore 1.0 does not model individual spaces, floors, sectors, or slots.

### Vehicle

`Vehicle` is a known visiting vehicle within one parking facility. It does not belong to `User` and has no customer account relation.

Its canonical identity is `(parkingId, normalizedPlate)`. The current implementation only trims and uppercases plates. Phase 2 must specify and apply one normalization rule consistently (including its data migration policy) before relying on it as the canonical identity.

Vehicle HTTP operations will remain only when they serve a real operational need. Standalone CRUD is not a 1.0 goal; unused vehicle schemas and code will be removed during implementation.

### ParkingSession

`ParkingSession` is the definitive name for the entity currently called `Booking`. It represents an actual vehicle stay at a parking facility; it is not a reservation.

Its definitive lifecycle is:

```text
check-in:  ACTIVE
ACTIVE --check-out--> COMPLETED
ACTIVE --cancel----> CANCELLED
```

`COMPLETED` and `CANCELLED` are terminal. `PENDING` does not exist in 1.0.

An active session occupies one unit of parking capacity. Check-in must create an `ACTIVE` session only when the parking is active, the capacity is available, and that vehicle has no other active session. These checks remain concurrency-safe and transactional.

### Pricing and Currency

Money must use integer cents, never `Float`. Each parking has an explicit currency, and each parking session stores both the currency and a snapshot of the hourly rate in effect at check-in. Changing a parking's rate must not change an existing session's rate.

Before changing billing behavior, Phase 2 must preserve and test the current formula exactly:

```text
elapsedHours = (checkoutTime - startTime) / 3,600,000
chargedHours = max(1, ceil(elapsedHours))
totalPrice = chargedHours * parking.pricePerHour
```

The target equivalent is `totalAmountCents = chargedHours * hourlyRateCents`. The move to cents must not silently change the one-hour minimum or ceiling-to-the-next-hour behavior. Any intentional correction needs a separately documented decision.

### Reviews

Reviews are not part of the ParkCore 1.0 core product. ParkCore will remove them rather than introduce customer accounts, eligibility, moderation, or RBAC solely to sustain reviews.

## Target Persistence Model

The implementation target is a `ParkingSession` model and `ParkingSessionStatus` enum with `ACTIVE`, `COMPLETED`, and `CANCELLED`. `Parking` will store an integer hourly rate, explicit currency, and capacity. A parking session will store its rate snapshot, currency snapshot, and final amount in cents.

This document intentionally records the target semantics rather than exact Prisma field names, except where names are already mandated (`ParkingSession` and `ParkingSessionStatus`). Phase 2 must choose clear, consistent names such as `hourlyRateCents`, `totalAmountCents`, and `capacity` and apply them throughout the API contract.

## Approved Phase 2 Migration Policy

The following implementation parameters are approved for ParkCore 1.0:

| Concern                   | Approved policy                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API compatibility         | Make a direct breaking migration to ParkCore 1.0. Do not provide legacy `Booking` routes, types, fields, or aliases.                                                                                                                                               |
| Plate normalization       | Trim, uppercase, and remove every non-alphanumeric character. The canonical identity is `(parkingId, normalizedPlate)`.                                                                                                                                            |
| Float to cents            | Convert existing prices with `round(value * 100)`.                                                                                                                                                                                                                 |
| `PENDING` data            | Reset development/demo data. For data that must be preserved, export `PENDING` rows and then remove them; do not reinterpret them as another state.                                                                                                                |
| Historical rate snapshots | For completed sessions, derive the historical hourly rate from historical total and duration when possible. For active or cancelled sessions that must be preserved, fall back to the current parking rate. Prefer a clean reset for nonvaluable development data. |
| Currency                  | Identify currency explicitly before preserving existing monetary records. Fresh and demo data uses the selected seed currency.                                                                                                                                     |

## Phase 2 Impact Analysis

### Prisma Models and Enums Affected

| Current model or enum | Required impact                                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`                | No structural role expansion. Its ownership relation remains the sole authorization relation.                                                                                                         |
| `Parking`             | Replace floating hourly price with integer cents and explicit currency; rename or redefine `totalSpaces` as capacity; retain `isActive`; replace `bookings` with `parkingSessions`; remove `reviews`. |
| `Vehicle`             | Retain parking ownership and composite unique identity, but enforce the chosen plate normalization. Replace its `bookings` relation with `parkingSessions`.                                           |
| `Booking`             | Rename to `ParkingSession`; replace `totalPrice` with integer final amount; add hourly-rate and currency snapshots; retain start/end timestamps; keep parking and vehicle relations.                  |
| `Review`              | Remove model, relation, table, and API support.                                                                                                                                                       |
| `BookingStatus`       | Replace with `ParkingSessionStatus(ACTIVE, COMPLETED, CANCELLED)`; remove `PENDING` and map current `CONFIRMED` to `ACTIVE`.                                                                          |
| `VehicleType`         | Unchanged.                                                                                                                                                                                            |

### Migrations Required

No migration is generated in Phase 1. Phase 2 needs the following reviewed migrations, with backups and staging validation before production deployment:

1. **Monetary and capacity data migration.** Convert `Parking.pricePerHour` from `Float` to an integer cents field using `round(value * 100)`, add an explicit parking currency, and rename or replace `totalSpaces` with capacity. Currency must be identified before preserving existing monetary rows; fresh/demo data uses the selected seed currency.
2. **Session migration.** Rename the `Booking` table/model to `ParkingSession`, rename its enum, map `CONFIRMED` to `ACTIVE`, remove `PENDING`, and add hourly-rate and currency snapshot columns plus an integer final-amount field.
3. **Historical-data policy.** Reset development/demo data. For preserved data, export and remove `PENDING` rows without reinterpretation. Backfill completed-session rates from historical total and duration when possible; use the current parking rate only as the approved fallback for preserved active or cancelled sessions. Prefer clean resets for nonvaluable development data.
4. **Review removal.** Drop the review foreign key, relation, table, and the old review-only migration history only by adding a new forward migration. Do not edit applied migrations.
5. **Generated client refresh.** Regenerate Prisma output after the schema migration; generated files are not hand-edited.

### Code Files Affected

The following are the current files that Phase 2 must modify, replace, or remove. Paths describe the current repository; Phase 1 performs no rename.

| Area                                                | Files                                                                                                                                                    | Required impact                                                                                                                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application composition                             | `app.ts`, `src/docs/register-feature-docs.ts`, `src/config/openapi.ts`                                                                                   | Replace booking/review registrations with the parking-session surface; remove review OpenAPI tags.                                                                          |
| Prisma and seed                                     | `prisma/schema.prisma`, `prisma/seed.ts`, a new forward migration under `prisma/migrations/`                                                             | Implement target model, data conversion, session seed values, and remove review seed data.                                                                                  |
| Parking feature                                     | `src/features/parking/parking.routes.ts`, `parking.controller.ts`, `parking.service.ts`, `parking.repository.ts`, `parking.schema.ts`, `parking.docs.ts` | Expose owner activation/deactivation via update, filter inactive parkings from public reads, preserve owner access to inactive parkings, and replace money/capacity fields. |
| Booking feature (to become parking-session feature) | `src/features/booking/booking.routes.ts`, `booking.controller.ts`, `booking.service.ts`, `booking.repository.ts`, `booking.schema.ts`, `booking.docs.ts` | Rename code and contract terminology, use active-session states, snapshots, cents, and the preserved billing formula.                                                       |
| Vehicle feature                                     | `src/features/vehicle/vehicle.routes.ts`, `vehicle.controller.ts`, `vehicle.service.ts`, `vehicle.repository.ts`, `vehicle.schema.ts`, `vehicle.docs.ts` | Apply canonical plate normalization and remove HTTP/schema operations that lack a real operational use.                                                                     |
| Review feature (remove)                             | every file in `src/features/review/`                                                                                                                     | Remove routes, controller, service, repository, schemas, OpenAPI registration, and rate-limit test.                                                                         |
| Review rate limiter                                 | `src/config/rate-limit.ts`                                                                                                                               | Remove `createReviewRateLimiter`; retain authentication limiting.                                                                                                           |
| OpenAPI assertion                                   | `src/scripts/check-openapi.ts`                                                                                                                           | Replace review-required path assertions with the parking-session contract checks.                                                                                           |
| Generated Prisma code                               | `prisma/generated/**`                                                                                                                                    | Regenerate only; never edit manually.                                                                                                                                       |

### Endpoints Affected

| Current endpoint                                                                                               | Required impact                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /parkings`                                                                                                | Hide inactive parkings from public results.                                                                                                             |
| `GET /parkings/:id`                                                                                            | Define public behavior for inactive IDs consistently with public listing; the owner must retain access through owner-authorized access.                 |
| `GET /parkings/me`                                                                                             | Continue returning both active and inactive owner parkings.                                                                                             |
| `PATCH /parkings/:id`                                                                                          | Permit owner-controlled `isActive` changes and accept the target capacity/rate/currency fields.                                                         |
| `POST /parkings/:parkingId/bookings/check-in`                                                                  | Move to parking-session terminology/path or provide an explicit compatibility plan; create `ACTIVE` and persist rate/currency snapshots.                |
| `GET /parkings/:parkingId/bookings/active`                                                                     | Use `ACTIVE` session state and parking-session terminology/path.                                                                                        |
| `GET /parkings/:parkingId/bookings`                                                                            | Replace status filter values and terminology.                                                                                                           |
| `POST /bookings/:bookingId/check-out`                                                                          | Use session terminology/path and calculate final cents from the snapshot.                                                                               |
| `GET /bookings/:bookingId`                                                                                     | Use session terminology/path and response fields.                                                                                                       |
| `PATCH /bookings/:bookingId/cancel`                                                                            | Use session terminology/path and allow only `ACTIVE -> CANCELLED`.                                                                                      |
| `POST /vehicles/:parkingId`, `GET /vehicles/:parkingId/plate/:plate`                                           | Review for deletion: the current 1.0 workflow can create/find vehicles as part of check-in, so standalone endpoints need a concrete consumer to remain. |
| `POST /reviews/parking/:parkingId`, `GET /reviews/parking/:parkingId`, `GET /reviews/parking/:parkingId/stats` | Remove.                                                                                                                                                 |

### Schemas Affected

| Current schema location                  | Required impact                                                                                                                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/parking/parking.schema.ts` | Add `isActive` to the appropriate owner update contract; replace floating price and `totalSpaces` with integer cents, currency, and capacity schemas; update responses and public-list behavior documentation. |
| `src/features/booking/booking.schema.ts` | Replace `Booking*` types, OpenAPI names, status enum values, IDs, and `totalPrice` response field with parking-session and cents/snapshot fields.                                                              |
| `src/features/vehicle/vehicle.schema.ts` | Centralize the final plate normalization rule. Remove `updateVehicleSchema`, vehicle list schemas, and vehicle-ID params if their endpoints remain absent.                                                     |
| `src/features/review/review.schema.ts`   | Remove with the review feature.                                                                                                                                                                                |

### Tests Affected

| Test location                                                                                        | Required impact                                                                                                                        |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/helpers/builders.ts`                                                                          | Replace `Booking` and `Review` builders; use cents, currency, capacity, and active-session defaults.                                   |
| `src/features/booking/booking.service.test.ts`                                                       | Replace with parking-session tests for state transitions, capacity, snapshots, preserved billing formula, and terminal states.         |
| `src/features/parking/parking.service.test.ts`                                                       | Cover public inactive filtering, owner access to inactive parkings, activation changes, capacity rules, and cents/currency validation. |
| `src/features/vehicle/vehicle.service.test.ts`                                                       | Cover the final normalized-plate identity and any retained vehicle operation.                                                          |
| `src/features/review/review.service.test.ts`, `src/features/review/review.routes.rate-limit.test.ts` | Remove.                                                                                                                                |
| `src/app.test.ts`                                                                                    | Replace mocked booking/review routers with the final parking-session surface and remove the review router mock.                        |
| `src/scripts/check-openapi.ts` checks and affected OpenAPI tests                                     | Replace review contract assertions with parking-session assertions.                                                                    |

### Documentation Affected in Phase 2

This Phase 1 closure updates only this existing domain document, as requested. When code changes land, synchronize the domain terminology in `README.md`, `docs/ARCHITECTURE.md`, `docs/API-DESIGN.md`, and `AGENTS.md`; the generated OpenAPI document remains the endpoint-level source of truth.

### Breaking Changes

- Model and generated-client names change from `Booking`/`BookingStatus` to `ParkingSession`/`ParkingSessionStatus`.
- `PENDING` and `CONFIRMED` status values disappear; `ACTIVE` replaces the active-state value.
- API routes, tags, schemas, and JSON field names using `booking` change directly to parking-session terminology. ParkCore 1.0 provides no legacy aliases or versioned compatibility layer.
- Price fields change from floating numbers to integer cents plus currency; `totalSpaces` may change to `capacity`.
- Public clients will no longer see inactive parkings in discovery/read flows, while owners retain access.
- Review endpoints and their data are removed.
- A chosen stricter plate-normalization rule can merge records that are currently distinct; it requires data review before enforcing the unique identity.

## Code That Will Become Dead

The following is confirmed or expected obsolete after Phase 2, and must not be removed during Phase 1:

- `src/features/review/**`, `createReviewRateLimiter`, review OpenAPI registration/tagging/checks, review seed logic, `Review` model/relation, and review tests.
- `Booking`, `BookingStatus`, `PENDING`, and all booking-specific types, OpenAPI component names, and route terminology once the parking-session rename is complete.
- `updateVehicleSchema`, `vehicleListResponseSchema`, `vehicleParamsSchema`, and `checkOutParamsSchema` are already unused by current routes; the first three should be removed unless a concrete vehicle operation is retained, and the last should be consolidated with the session ID schema.
- Standalone vehicle routes, controller handlers, response schema, and OpenAPI operations become dead if Phase 2 confirms check-in as their only real consumer.

## Safest Phase 2 Implementation Order

1. **Prepare the contract and data plan.** Record the currency for every preserved monetary dataset and create the required backup/export plan. The API migration is directly breaking; plate normalization, float-to-cents conversion, `PENDING` removal, and snapshot fallbacks follow the approved policy above.
2. **Remove reviews in one bounded change.** Remove its application surface, OpenAPI checks, seed data, tests, Prisma relation/table, and rate limiter with a forward migration and data backup plan.
3. **Implement parking lifecycle and public visibility.** Add owner activation/deactivation validation and authorization, filter public discovery, and test owner access to inactive parkings. Do not introduce deletion.
4. **Migrate money and capacity.** Add and validate cents/currency/capacity fields, backfill with the approved policy, update seeds/builders, and test the conversion before removing float fields.
5. **Rename and migrate booking to parking session.** Apply the reviewed model/enum/data migration, then rename the feature and OpenAPI contract according to the approved compatibility strategy. Implement `ACTIVE`, `COMPLETED`, and `CANCELLED` transitions only.
6. **Make pricing snapshot-based.** Persist hourly rate and currency at check-in; calculate checkout from that snapshot using the documented formula; add regression tests for minimum-hour and partial-hour cases.
7. **Finalize vehicle surface.** Apply normalization consistently, resolve concurrent first-registration behavior, and remove unused schemas and standalone vehicle endpoints that have no confirmed consumer.
8. **Regenerate and verify.** Regenerate Prisma, run OpenAPI generation/checks, lint, typecheck, tests, migration checks, and a staged data validation before release.

## Phase 2 Entry Criteria

Phase 2 can begin once the currency for any preserved monetary records is recorded and a backup/export plus staging plan exists for production data. The Phase 1 domain meaning and the Phase 2 migration policy are closed.
