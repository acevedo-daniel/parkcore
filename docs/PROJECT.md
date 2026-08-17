# Project

## Product

ParkCore is a personal parking operations application for parking owners, with a read-only public catalog of active parking facilities. Its backend is the 1.0 source of truth; the implemented web application consumes the published contract without expanding product scope.

It records vehicles entering and leaving an owner-operated parking facility, enforces concurrent capacity, and preserves the price charged for each stay.

## Actors

| Actor          | Capabilities                                                                    |
| -------------- | ------------------------------------------------------------------------------- |
| Public visitor | Lists, searches, filters, and views active parking facilities.                  |
| Owner/operator | Registers, manages a profile and owned parkings, and operates parking sessions. |

Visiting drivers may be recorded as contact data for a stay, but have no account or API access.

## Scope

- Public catalog of active parkings with search and rate filters.
- Public parking detail, URL-backed catalog pagination, and public 404.
- Owner authentication and profile management.
- Owner-controlled parking lifecycle through `isActive`.
- Owner parking management, active-session operations, checkout/cancel, and paginated history.
- Parking-scoped vehicle recognition during check-in.
- Active, completed, and cancelled parking sessions.
- Capacity based on concurrent active sessions.
- Integer-cent pricing with a rate and currency snapshot per session.

## Out of Scope

- Reservations, marketplace transactions, or public session creation.
- Payments, registered customers, employees, additional roles, or RBAC.
- Public feedback, moderation, and customer eligibility workflows.
- Physical spaces, floors, sectors, or slots.
- Public hard deletion of parkings.

## Domain

### Ownership and Parking

`User` is the sole owner/operator identity. Every `Parking` belongs to exactly one user.

`Parking.isActive` controls lifecycle. Active parkings appear in the public catalog and accept check-ins. Inactive parkings are visible to their owner but hidden publicly and reject new check-ins. Owners can reactivate or deactivate a parking.

### Vehicle and ParkingSession

`Vehicle` is stable vehicle identity inside one parking. It owns the normalized plate, type, brand, and model. Its identity is `(parkingId, normalizedPlate)`, where normalization trims, uppercases, and removes non-alphanumeric characters.

Check-in creates or reuses that identity. Returning vehicles update stable metadata only when the new check-in explicitly supplies it; omitted values never erase existing metadata.

`ParkingSession` is one actual visit. It owns visit-specific customer name, customer phone, operational notes, timestamps, status, and pricing snapshot.

```text
check-in: ACTIVE
ACTIVE --check-out--> COMPLETED
ACTIVE --cancel----> CANCELLED
```

`COMPLETED` and `CANCELLED` are terminal. There are no pending or confirmed states.

### Capacity and Pricing

Capacity is the maximum number of simultaneous `ACTIVE` sessions; ParkCore does not model physical slots.

Money uses integer cents. ParkCore 1.0 supports `USD` explicitly. Each session snapshots the parking hourly rate and currency at check-in. Checkout never reads a later parking rate.

```text
elapsedHours = (checkoutTime - startTime) / 3,600,000
chargedHours = max(1, ceil(elapsedHours))
totalAmountCents = chargedHours * hourlyRateCents
```

## Business Rules

- Public parking reads return only active parkings.
- Only the owner can operate a parking or one of its sessions.
- Check-in, capacity validation, and duplicate active-session validation run in a serializable transaction.
- A partial unique database index prevents more than one active session for the same parking and vehicle.
- Checkout and cancel perform an atomic conditional transition from `ACTIVE`.
- Vehicle data has no standalone HTTP CRUD API; it is managed through check-in.

## Relevant Limitations

- ParkCore 1.0 is a direct-breaking API: it offers `/sessions`, not compatibility aliases.
- Historical Prisma migrations retain former terminology because applied migrations are immutable. Active code, schema, and HTTP contracts do not use it.
- The supported-currency enum intentionally contains only USD. Supporting another currency requires an explicit domain and migration decision.
