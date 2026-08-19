# ParkCore — Project

> Product scope, actors, domain model, and durable business rules for ParkCore 1.0.

## Product

ParkCore is a parking-operations system for independent parking owners. Owners use it to manage facilities and the vehicle sessions taking place inside them; public visitors can browse active facilities through a read-only catalog.

The product focuses on the operational state of a parking facility: whether it is open for intake, how much capacity remains, which vehicles are currently inside, and how an individual stay is completed or cancelled.

## Problem

Running a parking facility requires a reliable current state. The operator needs to know which facilities are active, which vehicles are inside, whether capacity remains, and what rate applies to each stay.

ParkCore keeps those facts together in one workflow without expanding into reservations, payment processing, customer accounts, or marketplace behavior.

## Actors

| Actor          | Capabilities                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| Public visitor | Browse, search, filter, and view active parking facilities.                  |
| Owner/operator | Register, manage a profile and owned parkings, and operate parking sessions. |

Driver information can be recorded as visit data during check-in, but drivers do not have ParkCore accounts or direct API access.

## Scope

### Public experience

- List active parking facilities.
- Search and filter the catalog by address and hourly rate.
- View public parking details.
- Navigate paginated catalog results.
- Receive a public not-found state for unavailable facilities.

### Owner experience

- Register and authenticate as an owner.
- Manage the owner profile.
- Create and edit owned parking facilities.
- Activate or deactivate a parking.
- View occupancy and active sessions.
- Check vehicles in.
- Complete or cancel active sessions.
- Review paginated session history.

### Operational model

- Reuse a parking-scoped vehicle identity across visits.
- Track `ACTIVE`, `COMPLETED`, and `CANCELLED` sessions.
- Calculate capacity from concurrent active sessions.
- Preserve the hourly rate and currency that applied when a session started.

## Out of scope

ParkCore 1.0 intentionally does not include:

- reservations or advance booking;
- payments or payment-provider integrations;
- a multi-sided marketplace;
- registered driver/customer accounts;
- employees, additional operator roles, or RBAC;
- reviews, public feedback, or moderation;
- physical slots, floors, sectors, or numbered spaces;
- public hard deletion of parkings.

## Domain model

### User and Parking

`User` is the owner/operator identity. Every `Parking` belongs to exactly one user.

`Parking.isActive` controls operational availability:

- active parkings appear in the public catalog and may accept new check-ins;
- inactive parkings remain visible to their owner but are hidden from public discovery and reject new check-ins.

A parking also owns its configured capacity, hourly rate, currency, location, and the vehicles and sessions associated with that facility.

### Vehicle

`Vehicle` represents stable vehicle identity within one parking.

Its identity is parking-scoped: the same normalized plate may exist independently in different parking facilities. Plate normalization trims the input, uppercases it, and removes non-alphanumeric characters before identity lookup.

Stable vehicle metadata includes type, brand, and model. A returning vehicle can reuse that identity on a later check-in.

### ParkingSession

`ParkingSession` represents one actual stay.

A session owns visit-specific data such as:

- start and end time;
- customer name and phone when provided;
- operational notes;
- status;
- hourly-rate and currency snapshot;
- final amount when completed.

The lifecycle is deliberately small:

```text
check-in -> ACTIVE

ACTIVE --checkout--> COMPLETED
ACTIVE --cancel----> CANCELLED
```

`COMPLETED` and `CANCELLED` are terminal states.

## Capacity and pricing

Capacity is the maximum number of simultaneous `ACTIVE` sessions in a parking. ParkCore does not model individual physical spaces.

Money is stored in integer cents. ParkCore 1.0 supports `USD`.

At check-in, the session snapshots the parking's hourly rate and currency. Checkout therefore uses the terms that applied when the stay began, even if the parking configuration changes later.

Billing uses started hours with a one-hour minimum:

```text
elapsedHours = (checkoutTime - startTime) / 3,600,000
chargedHours = max(1, ceil(elapsedHours))
totalAmountCents = chargedHours * hourlyRateCents
```

## Business rules

- Only active parkings are exposed through public parking reads.
- Only the owner may modify a parking or operate its sessions.
- An inactive parking cannot accept a new check-in.
- A parking cannot exceed its configured number of concurrent active sessions.
- The same parking/vehicle pair cannot have more than one active session.
- Check-in performs capacity and duplicate-active-session validation in a serializable transaction.
- A database-level partial unique index reinforces the one-active-session invariant for a parking/vehicle pair.
- Checkout and cancellation transition only an `ACTIVE` session.
- Checkout calculates from the session's stored pricing snapshot.
- Vehicle identity is managed through the check-in workflow; there is no standalone vehicle CRUD surface.

## Product limitations

- `USD` is the only supported currency in ParkCore 1.0.
- Capacity represents concurrent vehicles, not mapped physical spaces.
- The public experience is discovery-only: it cannot create or alter parking sessions.
- Driver/contact data belongs to an individual stay and does not create a customer account.

## Related documentation

- [README](../README.md)
- [Architecture](ARCHITECTURE.md)
- [Development](DEVELOPMENT.md)
- [Testing](TESTING.md)
- [Deployment](DEPLOYMENT.md)
