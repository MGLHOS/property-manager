# Property Manager

A TypeScript utility library that satisfies four property management requirements using CSV data files.

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

## Quick start

```bash
npm install
npm test
```

## Project structure

```
property-manager/
├── data/
│   ├── properties.csv          # Source data – properties
│   └── tenants.csv             # Source data – tenants
├── src/
│   ├── types.ts                # Shared type definitions
│   ├── loader.ts               # CSV parsing utilities
│   ├── propertyService.ts      # The four requirement functions
│   └── index.ts                # Public API re-exports
└── __tests__/
    └── propertyService.test.ts # Jest test suite (27 tests)
```

## Requirements

### 1 · Average rent by region (`averageRentByRegion`)

```ts
averageRentByRegion(properties: Property[], region: Region): number
```

Accepts a `Region` (`"ENGLAND" | "SCOTLAND" | "WALES" | "N.IRELAND"`) and returns the mean `monthlyRentPence` across all properties in that region. Returns `0` if there are no properties for the region.

---

### 2 · Monthly rent per tenant (`monthlyRentPerTenant`)

```ts
monthlyRentPerTenant(
  property: Property,
  tenants: Tenant[],
  unit?: RentUnit         // "pence" (default) | "pounds"
): number
```

Splits the property's total monthly rent equally between its tenants. The unit parameter controls whether the result is returned in pence or pounds. Throws an `Error` if the property has no tenants.

---

### 3 · Invalid postcode property IDs (`invalidPostcodePropertyIds`)

```ts
invalidPostcodePropertyIds(properties: Property[]): string[]
```

Validates each property's postcode against the [official UK postcode format](https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom) (all six outward-code patterns × mandatory `space` × inward code `NAA`). Returns the IDs of properties with an invalid postcode.

Known invalid postcodes in the supplied dataset:

| Property ID | Postcode | Issue                     |
|-------------|----------|---------------------------|
| `p_1025`    | `B15 2T` | Inward code missing digit |
| `p_1080`    | `46 2ST` | Outward code starts with digits |
| `p_1100`    | `M60 1W` | Inward code missing second letter |

---

### 4 · Property status (`getPropertyStatus`)

```ts
getPropertyStatus(
  property: Property,
  tenants: Tenant[],
  today?: Date            // defaults to new Date(); injectable for testing
): PropertyStatus
```

Returns one of four statuses based on tenant occupancy and the tenancy end date:

| Status               | Condition                                                                                   |
|----------------------|---------------------------------------------------------------------------------------------|
| `PROPERTY_VACANT`    | No tenants                                                                                  |
| `PARTIALLY_VACANT`   | At least one tenant, fewer than `capacity`, and tenancy end date has **not** passed         |
| `PROPERTY_ACTIVE`    | Tenants fill or exceed `capacity`, and tenancy end date has **not** passed                  |
| `PROPERTY_OVERDUE`   | At least one tenant, but the tenancy end date **has** passed                                |

The `today` parameter is injectable so tests can exercise all branches without relying on the wall clock.

## Design decisions

- **Pure functions** – all four functions accept data as parameters rather than reading CSV files internally. This keeps them trivially testable and reusable.
- **Dependency injection for time** – `getPropertyStatus` accepts an optional `today: Date` so tests can control the current date deterministically.
- **No third-party runtime dependencies** – only Node's built-in `fs` module is used for CSV loading; all business logic has zero runtime dependencies.
- **Type safety** – strict TypeScript types catch region misspellings and unit typos at compile time.
