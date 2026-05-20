import {
  averageRentByRegion,
  monthlyRentPerTenant,
  invalidPostcodePropertyIds,
  getPropertyStatus,
} from "../src/propertyService";
import { loadProperties, loadTenants } from "../src/loader";
import { Property, Tenant } from "../src/types";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const makeProperty = (overrides: Partial<Property> = {}): Property => ({
  id: "p_1000",
  address: "1 Test Street",
  postcode: "SW1A 1AA",
  monthlyRentPence: 120000,
  region: "ENGLAND",
  capacity: 3,
  tenancyEndDate: "2030-01-01",
  ...overrides,
});

const makeTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: "t_1000",
  propertyId: "p_1000",
  name: "Alice Example",
  ...overrides,
});

// ─── 1. averageRentByRegion ───────────────────────────────────────────────────

describe("averageRentByRegion", () => {
  const properties: Property[] = [
    makeProperty({ id: "p_1", region: "ENGLAND", monthlyRentPence: 100000 }),
    makeProperty({ id: "p_2", region: "ENGLAND", monthlyRentPence: 200000 }),
    makeProperty({ id: "p_3", region: "SCOTLAND", monthlyRentPence: 150000 }),
  ];

  it("returns the average rent in pence by default", () => {
    expect(averageRentByRegion(properties, "ENGLAND")).toBe(150000);
  });

  it("returns the average rent in pence when explicitly requested", () => {
    expect(averageRentByRegion(properties, "ENGLAND", "pence")).toBe(150000);
  });

  it("returns the average rent in pounds when requested", () => {
    expect(averageRentByRegion(properties, "ENGLAND", "pounds")).toBe(1500);
  });

  it("returns the correct average when there is only one property in the region", () => {
    expect(averageRentByRegion(properties, "SCOTLAND", "pounds")).toBe(1500);
  });

  it("returns 0 when no properties exist in the region", () => {
    expect(averageRentByRegion(properties, "WALES")).toBe(0);
  });

  it("returns a valid number", () => {
    const result = averageRentByRegion(properties, "ENGLAND");
    expect(typeof result).toBe("number");
    expect(isNaN(result)).toBe(false);
  });

  it("works with real data", () => {
    const result = averageRentByRegion(loadProperties(), "ENGLAND");
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe("number");
  });
});

// ─── 2. monthlyRentPerTenant ─────────────────────────────────────────────────

describe("monthlyRentPerTenant", () => {
  const property = makeProperty({ monthlyRentPence: 120000 });
  const tenants: Tenant[] = [
    makeTenant({ id: "t_1", propertyId: "p_1000" }),
    makeTenant({ id: "t_2", propertyId: "p_1000" }),
    makeTenant({ id: "t_3", propertyId: "p_1000" }),
  ];

  it("splits rent equally between tenants in pence (default)", () => {
    expect(monthlyRentPerTenant(property, tenants)).toBe(40000);
  });

  it("splits rent equally between tenants in pence when explicitly requested", () => {
    expect(monthlyRentPerTenant(property, tenants, "pence")).toBe(40000);
  });

  it("splits rent equally between tenants in pounds", () => {
    expect(monthlyRentPerTenant(property, tenants, "pounds")).toBe(400);
  });

  it("works with a single tenant", () => {
    const soloTenant = [makeTenant()];
    expect(monthlyRentPerTenant(property, soloTenant, "pence")).toBe(120000);
    expect(monthlyRentPerTenant(property, soloTenant, "pounds")).toBe(1200);
  });

  it("only counts tenants belonging to the given property", () => {
    const mixedTenants: Tenant[] = [
      makeTenant({ id: "t_1", propertyId: "p_1000" }),
      makeTenant({ id: "t_2", propertyId: "p_1000" }),
      makeTenant({ id: "t_3", propertyId: "OTHER_PROPERTY" }),
    ];
    expect(monthlyRentPerTenant(property, mixedTenants, "pence")).toBe(60000);
  });

  it("throws an error if the property has no tenants", () => {
    expect(() => monthlyRentPerTenant(property, [])).toThrow();
  });

  it("throws an error when tenants list contains no tenants for this property", () => {
    const otherTenants = [makeTenant({ propertyId: "OTHER_PROPERTY" })];
    expect(() => monthlyRentPerTenant(property, otherTenants)).toThrow(
      `Property ${property.id} has no tenants`,
    );
  });
});

// ─── 3. invalidPostcodePropertyIds ───────────────────────────────────────────

describe("invalidPostcodePropertyIds", () => {
  it("returns an empty array when all postcodes are valid", () => {
    const properties = [
      makeProperty({ id: "p_1", postcode: "SW1A 1AA" }),
      makeProperty({ id: "p_2", postcode: "EC1A 1BB" }),
      makeProperty({ id: "p_3", postcode: "W1A 0AX" }),
      makeProperty({ id: "p_4", postcode: "M1 1AE" }),
      makeProperty({ id: "p_5", postcode: "B1 1BB" }),
      makeProperty({ id: "p_6", postcode: "CR2 6XH" }),
      makeProperty({ id: "p_7", postcode: "DN55 1PT" }),
    ];
    expect(invalidPostcodePropertyIds(properties)).toEqual([]);
  });

  it("flags properties with invalid postcodes", () => {
    const properties = [
      makeProperty({ id: "p_good", postcode: "SW1A 1AA" }),
      makeProperty({ id: "p_bad_1", postcode: "INVALID" }),
      makeProperty({ id: "p_bad_2", postcode: "46 2ST" }),
      makeProperty({ id: "p_bad_3", postcode: "B15 2T" }),
    ];
    const result = invalidPostcodePropertyIds(properties);
    expect(result).toContain("p_bad_1");
    expect(result).toContain("p_bad_2");
    expect(result).toContain("p_bad_3");
    expect(result).not.toContain("p_good");
  });

  it("handles all valid UK postcode formats", () => {
    expect(
      invalidPostcodePropertyIds([
        makeProperty({ id: "p_1", postcode: "M1 1AE" }),
      ]),
    ).toEqual([]); // AN
    expect(
      invalidPostcodePropertyIds([
        makeProperty({ id: "p_1", postcode: "M60 1NW" }),
      ]),
    ).toEqual([]); // ANN
    expect(
      invalidPostcodePropertyIds([
        makeProperty({ id: "p_1", postcode: "CR2 6XH" }),
      ]),
    ).toEqual([]); // AAN
    expect(
      invalidPostcodePropertyIds([
        makeProperty({ id: "p_1", postcode: "DN55 1PT" }),
      ]),
    ).toEqual([]); // AANN
    expect(
      invalidPostcodePropertyIds([
        makeProperty({ id: "p_1", postcode: "W1A 0AX" }),
      ]),
    ).toEqual([]); // ANA
    expect(
      invalidPostcodePropertyIds([
        makeProperty({ id: "p_1", postcode: "EC1A 1BB" }),
      ]),
    ).toEqual([]); // AANA
  });

  it("is case insensitive", () => {
    expect(
      invalidPostcodePropertyIds([
        makeProperty({ id: "p_1", postcode: "sw1a 1aa" }),
      ]),
    ).toEqual([]);
  });

  it("returns the correct invalid property IDs from real data", () => {
    const result = invalidPostcodePropertyIds(loadProperties());
    expect(result).toContain("p_1025"); // "B15 2T"  — inward code missing digit
    expect(result).toContain("p_1080"); // "46 2ST"  — outward code starts with digits
    expect(result).toContain("p_1100"); // "M60 1W"  — inward code missing second letter
  });
});

// ─── 4. getPropertyStatus ─────────────────────────────────────────────────────

describe("getPropertyStatus", () => {
  const FUTURE = "2099-01-01";
  const PAST = "2000-01-01";
  const TODAY = new Date("2025-06-15");

  it("returns PROPERTY_VACANT when there are no tenants", () => {
    const property = makeProperty({ capacity: 3, tenancyEndDate: FUTURE });
    expect(getPropertyStatus(property, [], TODAY)).toBe("PROPERTY_VACANT");
  });

  it("returns PROPERTY_VACANT when there are no tenants even if the tenancy is overdue", () => {
    const property = makeProperty({ capacity: 3, tenancyEndDate: PAST });
    expect(getPropertyStatus(property, [], TODAY)).toBe("PROPERTY_VACANT");
  });

  it("returns PARTIALLY_VACANT when tenants exist but are below capacity and tenancy is active", () => {
    const property = makeProperty({
      id: "p_1000",
      capacity: 3,
      tenancyEndDate: FUTURE,
    });
    const tenants = [makeTenant({ propertyId: "p_1000" })];
    expect(getPropertyStatus(property, tenants, TODAY)).toBe(
      "PARTIALLY_VACANT",
    );
  });

  it("returns PROPERTY_ACTIVE when tenants meet capacity and tenancy is active", () => {
    const property = makeProperty({
      id: "p_1000",
      capacity: 2,
      tenancyEndDate: FUTURE,
    });
    const tenants = [
      makeTenant({ id: "t_1", propertyId: "p_1000" }),
      makeTenant({ id: "t_2", propertyId: "p_1000" }),
    ];
    expect(getPropertyStatus(property, tenants, TODAY)).toBe("PROPERTY_ACTIVE");
  });

  it("returns PROPERTY_ACTIVE when tenants exceed capacity and tenancy is active", () => {
    const property = makeProperty({
      id: "p_1000",
      capacity: 1,
      tenancyEndDate: FUTURE,
    });
    const tenants = [
      makeTenant({ id: "t_1", propertyId: "p_1000" }),
      makeTenant({ id: "t_2", propertyId: "p_1000" }),
    ];
    expect(getPropertyStatus(property, tenants, TODAY)).toBe("PROPERTY_ACTIVE");
  });

  it("returns PROPERTY_OVERDUE when the tenancy end date has passed and tenants exist", () => {
    const property = makeProperty({
      id: "p_1000",
      capacity: 3,
      tenancyEndDate: PAST,
    });
    const tenants = [makeTenant({ propertyId: "p_1000" })];
    expect(getPropertyStatus(property, tenants, TODAY)).toBe(
      "PROPERTY_OVERDUE",
    );
  });

  it("returns PROPERTY_OVERDUE even when fully occupied if the tenancy has expired", () => {
    const property = makeProperty({
      id: "p_1000",
      capacity: 2,
      tenancyEndDate: PAST,
    });
    const tenants = [
      makeTenant({ id: "t_1", propertyId: "p_1000" }),
      makeTenant({ id: "t_2", propertyId: "p_1000" }),
    ];
    expect(getPropertyStatus(property, tenants, TODAY)).toBe(
      "PROPERTY_OVERDUE",
    );
  });

  it("ignores tenants belonging to other properties", () => {
    const property = makeProperty({
      id: "p_1000",
      capacity: 3,
      tenancyEndDate: FUTURE,
    });
    const tenants = [
      makeTenant({ id: "t_other", propertyId: "ANOTHER_PROPERTY" }),
    ];
    expect(getPropertyStatus(property, tenants, TODAY)).toBe("PROPERTY_VACANT");
  });

  it("defaults to the current date when none is provided", () => {
    const property = makeProperty({ tenancyEndDate: FUTURE });
    const result = getPropertyStatus(property, []);
    const validStatuses = [
      "PROPERTY_VACANT",
      "PARTIALLY_VACANT",
      "PROPERTY_ACTIVE",
      "PROPERTY_OVERDUE",
    ];
    expect(validStatuses).toContain(result);
  });

  it("returns a valid status for every property in real data", () => {
    const validStatuses = new Set([
      "PROPERTY_VACANT",
      "PARTIALLY_VACANT",
      "PROPERTY_ACTIVE",
      "PROPERTY_OVERDUE",
    ]);
    loadProperties().forEach((p) => {
      expect(
        validStatuses.has(getPropertyStatus(p, loadTenants(), TODAY)),
      ).toBe(true);
    });
  });
});
