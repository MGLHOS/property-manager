# Property Manager

A TypeScript library for property portfolio analytics — calculating rents, validating addresses, and reporting occupancy status across a portfolio of properties and tenants.

## Requirements

- Node.js 24 (LTS) — see `.nvmrc`
- npm 9+

## Getting started

```bash
npm install             # install dependencies
npm test                # run the test suite
npm run test:coverage   # run tests with full coverage report
npm run lint            # check for code quality issues
npm run lint:fix        # auto-fix lint issues where possible
npm run format          # auto-format all source files
npm run format:check    # check formatting without making changes
npm run build           # compile to dist/
```

## API

All functions are pure — they accept data as arguments and have no side effects.
Load your data however suits your infrastructure and pass it in.

### `averageRentByRegion(properties, region, unit?)`

Returns the mean monthly rent for all properties in a given region.

```ts
import { averageRentByRegion } from "./src";

averageRentByRegion(properties, "ENGLAND"); // → 154320 (pence, default)
averageRentByRegion(properties, "ENGLAND", "pence"); // → 1543.20
```

- `unit` defaults to `"pounds"`. Pass `"pence"` to get the raw integer value.
- Returns `0` if the region has no properties.

---

### `monthlyRentPerTenant(property, tenants, unit?)`

Returns the monthly rent owed by each tenant at a property, split equally.

```ts
import { monthlyRentPerTenant } from "./src";

monthlyRentPerTenant(property, tenants); // → 40000 (pence, default)
monthlyRentPerTenant(property, tenants, "pounds"); // → 400
```

- `unit` defaults to `"pence"` to preserve precision when dividing.
- Throws if the property has no tenants.

---

### `invalidPostcodePropertyIds(properties)`

Returns the IDs of any properties whose postcode doesn't conform to the [UK postcode format](https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom).

```ts
import { invalidPostcodePropertyIds } from "./src";

invalidPostcodePropertyIds(properties); // → ["p_1025", "p_1080", "p_1100"]
```

Validates all six Royal Mail outward-code formats (AN, ANN, AAN, AANN, ANA, AANA) followed by the mandatory space and inward code (NAA). Matching is case-insensitive.

---

### `getPropertyStatus(property, tenants, today?)`

Returns the current occupancy status of a property.

```ts
import { getPropertyStatus } from "./src";

getPropertyStatus(property, tenants); // → "PROPERTY_ACTIVE"
```

| Status             | Condition                                   |
| ------------------ | ------------------------------------------- |
| `PROPERTY_VACANT`  | No tenants assigned                         |
| `PARTIALLY_VACANT` | Has tenants, below capacity, tenancy active |
| `PROPERTY_ACTIVE`  | At or above capacity, tenancy active        |
| `PROPERTY_OVERDUE` | Has tenants but tenancy end date has passed |

The optional `today` parameter overrides the current date — useful in tests to produce deterministic results.

## Project structure

```
property-manager/
├── src/
│   ├── types.ts            # Shared domain types
│   ├── loader.ts           # CSV parsing
│   ├── propertyService.ts  # Core business logic
│   └── index.ts            # Public exports
├── __tests__/
│   └── propertyService.test.ts
└── data/
    ├── properties.csv
    └── tenants.csv
```
