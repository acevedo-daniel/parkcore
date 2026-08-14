# Project

## Summary

ParkCore is a personal backend for owners who operate parking facilities. It records vehicles entering and leaving a facility, tracks concurrent capacity, and provides an API contract for an owner-facing application.

## Problem

Parking operations need a small, reliable record of which vehicles are currently inside a facility and what each stay costs, without treating the product as a customer marketplace or advance-reservation system.

## Users and Stakeholders

| Role              | Need or responsibility                                                                  |
| ----------------- | --------------------------------------------------------------------------------------- |
| Owner/operator    | Manages their own facilities and records vehicle stays.                                 |
| Visiting customer | Exists only as optional contact information on a vehicle; has no account or API access. |

## Goals

- Provide owner-scoped parking and vehicle operations.
- Keep capacity, active stays, and final pricing consistent under concurrent check-ins.
- Maintain a typed, documented HTTP contract.

## Scope

- User authentication for parking owners/operators.
- Parking lifecycle through active/inactive state.
- Vehicles known within a parking facility.
- Active, completed, and cancelled parking sessions.
- Capacity based on concurrent active sessions.
- Hourly pricing in integer cents with explicit currency and per-session rate snapshots.

## Out of Scope

- Marketplace discovery or customer reservations.
- Registered customers, employees, or additional roles.
- Payments, physical space/slot management, and public hard deletion.
- Reviews, moderation, or customer eligibility workflows.

## Success Criteria

- Only the owner can operate their parking facilities.
- An inactive parking cannot accept a new check-in and is not publicly listed.
- A vehicle has at most one active session, and active sessions cannot exceed parking capacity.
- Completed sessions use the hourly rate and currency captured at check-in.

## Relevant Constraints

- ParkCore 1.0 is a direct breaking API migration: no legacy `Booking` aliases or compatibility routes.
- The current code retains the legacy `Booking` name until the Phase 2 migration is applied.
- Prisma migrations must be forward-only; never edit an applied migration or generated Prisma output.

## Approved Domain Decisions

### Ownership and Parking Lifecycle

`User` is the sole owner/operator identity in 1.0; there are no added roles. Every `Parking` belongs to exactly one user.

`isActive` defines parking lifecycle. Active parkings accept check-ins and appear in public lists. Inactive parkings reject check-ins and are hidden from public lists, but remain visible to their owner. Owners can reactivate or deactivate a parking; there is no public hard delete in 1.0.

### Vehicle and Session Lifecycle

`Vehicle` is a visiting vehicle known by one parking, not by a user. Its canonical identity is `(parkingId, normalizedPlate)`, where normalization trims, uppercases, and removes non-alphanumeric characters.

`ParkingSession` is the definitive replacement for the legacy `Booking` name. It models an actual stay:

```text
check-in: ACTIVE
ACTIVE --check-out--> COMPLETED
ACTIVE --cancel----> CANCELLED
```

`COMPLETED` and `CANCELLED` are terminal; `PENDING` does not exist. Capacity is the maximum number of simultaneous active sessions. ParkCore does not model individual spaces, floors, sectors, or slots.

### Pricing

Money uses integer cents and explicit currency. A parking session snapshots the hourly rate and currency at check-in; a later parking rate change cannot affect it.

The billing formula to preserve is:

```text
elapsedHours = (checkoutTime - startTime) / 3,600,000
chargedHours = max(1, ceil(elapsedHours))
totalAmountCents = chargedHours * hourlyRateCents
```

## Approved Migration Policy

| Concern              | Policy                                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API compatibility    | Direct breaking ParkCore 1.0 migration; no legacy booking aliases.                                                                                                                                                       |
| Float to cents       | Convert with `round(value * 100)`.                                                                                                                                                                                       |
| `PENDING` data       | Reset development/demo data. For preserved data, export and remove it; never reinterpret it.                                                                                                                             |
| Historical snapshots | Derive a completed-session rate from historical total and duration when possible. For preserved active/cancelled sessions, fall back to the current parking rate. Prefer a clean reset for nonvaluable development data. |
| Currency             | Identify currency before preserving monetary records. Fresh/demo data uses USD, selected from the seeded New York parking.                                                                                               |

## Phase 2 Plan

1. Record currency for every preserved monetary dataset and prepare a backup/export plus staging-validation plan.
2. Remove reviews through a forward migration and remove their API, seed, OpenAPI, rate limiting, and tests. **Completed in Phase 2.1.**
3. Implement owner parking activation/deactivation and public inactive filtering. **Completed in Phase 2.2.**
4. Migrate parking prices and capacity to cents, currency, and capacity fields. **Completed in Phase 2.3 for disposable/demo data.** The forward migration intentionally stops when Parking data exists; preserving data requires a reviewed, currency-specific migration that applies `round(pricePerHour * 100)`.
5. Replace `Booking` and `BookingStatus` with `ParkingSession` and `ParkingSessionStatus` (`ACTIVE`, `COMPLETED`, `CANCELLED`).
6. Persist rate/currency snapshots at check-in and retain the documented billing formula.
7. Apply plate normalization, retain only needed vehicle operations, regenerate Prisma, and run the full verification suite.
