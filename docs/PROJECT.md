# ParkCore - Project

> Product scope, actors, domain model, and durable business rules for ParkCore 1.0.

## Product

ParkCore is a parking-operations system for independent parking owners. Owners use it to manage facilities and the vehicle sessions taking place inside them; public visitors can browse explicitly listed, eligible facilities through a read-only catalog.

The product focuses on the operational state of a parking facility: whether it is open for intake, how much capacity remains, which vehicles are currently inside, and how an individual stay is completed or cancelled.

## Problem

Running a parking facility requires a reliable current state. The operator needs to know which facilities are active, which vehicles are inside, whether capacity remains, and what rate applies to each stay.

ParkCore keeps those facts together in one workflow without expanding into reservations, payment processing, customer accounts, or marketplace behavior.

## Actors

| Actor          | Capabilities                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Public visitor | Browse, search, filter, and view eligible parking facilities.                                                                          |
| Owner/operator | Register with first name, last name, email, password, and timezone; manage a profile and owned parkings; and operate parking sessions. |

The API also distinguishes non-credentialed `DEMO` and `SHOWCASE` identities. Demo access is time-bounded; showcase identities cannot operate or edit parking data.

Driver information can be recorded as visit data during check-in, but drivers do not have ParkCore accounts or direct API access.

## Scope

### Public experience

- List active parking facilities.
- Search and filter the catalog by address and hourly rate.
- View public parking details.
- Estimate an advisory stay cost from a facility's current hourly rate.
- Navigate paginated catalog results.
- Receive a public not-found state for unavailable facilities.

### Owner experience

- Register and authenticate as an owner with a valid IANA timezone. The browser supplies its timezone when available, and the API falls back to `America/Argentina/Buenos_Aires`.
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
- Review history by parking-local today, 7-day, and 30-day periods.
- Export complete filtered history and view revenue grouped by currency.

### Client preferences

- The web client supports Spanish (`es-AR`) and English (`en-US`), with Spanish as the default.
- Appearance supports `system`, `light`, and `dark` preferences.
- Language and appearance preferences persist in the browser and apply without changing the current route or form state.
- The system appearance follows the operating system only while `system` is selected.
- Shared navigation, appearance, loading, error, and feedback messages use parity-checked Spanish and English catalogs.
- Shared authentication, profile, parking, check-in, occupancy, and session workflows use the same catalogs for labels, validation, recovery messages, status announcements, and accessible names. Changing language revalidates visible form feedback without remounting the form or losing entered values.

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

`User` is an identity with one of three kinds: `OWNER`, `DEMO`, or `SHOWCASE`. Owners authenticate with credentials. Demo and showcase identities have no credentials; demo identities include an expiration time. Every `Parking` belongs to exactly one user.

`Parking.isActive` controls operational availability:

- active parkings may accept new check-ins and can appear publicly when listed and owned by an eligible identity;
- inactive parkings remain visible to their owner but are hidden from public discovery and reject new check-ins.

`Parking.isListed` is independent publication state. Public discovery includes only parking owned by `OWNER` or `SHOWCASE` identities when `isListed=true` and `isActive=true`. DEMO-owned parking is never public. Public responses expose a restrained showcase marker, derived availability, available spaces, occupancy, and next opening without exposing owner identity or credentials.

A parking also owns its configured capacity, hourly rate, currency, location, and the vehicles and sessions associated with that facility.

The canonical SHOWCASE identity is a stable, non-credentialed account created by database setup. It owns six fictional Buenos Aires facilities: five listed active facilities used by public discovery and one paused unlisted facility retained as operational proof. The `showcase:refresh` maintenance command rebases its time-dependent sessions around an optional reference time without changing facility or asset identity. SHOWCASE data is read-only through the application and is always marked as fictional demonstration data in public responses.

Each demo entry creates an isolated four-hour DEMO sandbox with its own canonical facilities, vehicles, and sessions. Reset restores only the authenticated sandbox without extending its expiry. Expired or deleted DEMO access is rejected with a machine-readable `DEMO_EXPIRED` authentication error, and the browser clears the stale session so the visitor can start a new demo.

### Vehicle

`Vehicle` represents stable vehicle identity within one parking.

Its identity is parking-scoped: the same normalized plate may exist independently in different parking facilities. Plate normalization trims the input, uppercases it, and removes non-alphanumeric characters before identity lookup. A returning check-in reuses the vehicle only within that parking and may update type, brand, or model from the values confirmed for the visit. Customer name, phone, and notes remain visit-specific and are never copied from an earlier session.

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

An `ACTIVE` session has no `endTime`. Both terminal transitions record the time they occur; cancellation leaves `totalAmountCents` null.

Network analytics use the owner's IANA timezone. Parking history periods, displayed session times, and CSV timestamps use the parking's IANA timezone. Revenue summaries never combine ARS and USD amounts into one total.

## Capacity and pricing

Capacity is the maximum number of simultaneous `ACTIVE` sessions in a parking. ParkCore does not model individual physical spaces.

Money is stored in integer cents. ParkCore 1.0 supports `ARS` and `USD` without exchange-rate conversion.

At check-in, the session snapshots the parking's hourly rate and currency. Checkout therefore uses the terms that applied when the stay began, even if the parking configuration changes later.

Billing uses started hours with a one-hour minimum:

```text
elapsedHours = (checkoutTime - startTime) / 3,600,000
chargedHours = max(1, ceil(elapsedHours))
totalAmountCents = chargedHours * hourlyRateCents
```

The public estimator applies the same started-hour rule to the facility's current rate. It is advisory only: it does not reserve capacity or create a session.

## Business rules

- Public parking reads use one eligibility pipeline: eligible owner kind, listed state, active state, text search across title, neighborhood, and address, currency-safe price filtering, derived availability filtering and ordering, then pagination.
- Public availability is ordered as `AVAILABLE`, `LIMITED`, `FULL`, and `CLOSED`; a public price range requires an explicit currency context.
- Credential login is available only to `OWNER` identities.
- Only an authenticated `OWNER` or unexpired `DEMO` identity may modify a parking or operate its sessions.
- `SHOWCASE` identities cannot reach owner mutation or operation paths.
- Demo access tokens expire no later than the associated demo identity.
- Each demo entry creates its own four-hour DEMO owner and canonical scenario inside one transaction.
- Demo reset regenerates only the authenticated DEMO owner's scenario and preserves its original expiry.
- Expired or deleted DEMO subjects are rejected with `code=DEMO_EXPIRED`.
- Bounded opportunistic cleanup runs during demo creation, and `demo:cleanup` removes only expired DEMO owners.
- An inactive parking cannot accept a new check-in.
- A parking cannot exceed its configured number of concurrent active sessions.
- The same parking/vehicle pair cannot have more than one active session.
- Check-in performs capacity and duplicate-active-session validation in a serializable transaction.
- A database-level partial unique index reinforces the one-active-session invariant for a parking/vehicle pair.
- Checkout and cancellation transition only an `ACTIVE` session.
- Terminal sessions retain their terminal `endTime`; cancelled sessions retain a null amount.
- Checkout calculates from the session's stored pricing snapshot.
- History periods are parking-local `today`, `7d`, or `30d` filters, and aggregates cover every filtered session rather than only the current page.
- History CSV exports use local-offset ISO timestamps, include the parking timezone, exclude default customer contact columns, and leave cancelled totals empty.
- Vehicle identity is managed through the check-in workflow; there is no standalone vehicle CRUD surface.

## Product limitations

- `ARS` and `USD` are supported currencies in ParkCore 1.0.
- Capacity represents concurrent vehicles, not mapped physical spaces.
- The public experience is discovery-only: it cannot create or alter parking sessions.
- Driver/contact data belongs to an individual stay and does not create a customer account.

## Related documentation

- [README](../README.md)
- [Architecture](ARCHITECTURE.md)
- [Development](DEVELOPMENT.md)
- [Testing](TESTING.md)
- [Deployment](DEPLOYMENT.md)
