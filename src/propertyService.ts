import { Property, PropertyStatus, Region, RentUnit, Tenant } from "./types";

/**
 * Returns the average monthly rent for all properties in the given region.
 *
 * Returns 0 if no properties exist for the region. The unit parameter controls
 * whether the result is expressed in pence or pounds (defaults to pence).
 */
export function averageRentByRegion(
  properties: Property[],
  region: Region,
  unit: RentUnit = "pence",
): number {
  const regionProperties = properties.filter((p) => p.region === region);

  if (regionProperties.length === 0) {
    return 0;
  }

  const totalPence = regionProperties.reduce(
    (sum, p) => sum + p.monthlyRentPence,
    0,
  );
  const averagePence = totalPence / regionProperties.length;

  return unit === "pounds" ? averagePence / 100 : averagePence;
}

/**
 * Returns the monthly rent owed by each tenant at a given property.
 *
 * The total monthly rent is split equally across all current tenants.
 * The unit parameter controls whether the result is in pence or pounds
 * (defaults to pence to preserve precision when splitting).
 *
 * Throws if the property currently has no tenants.
 */
export function monthlyRentPerTenant(
  property: Property,
  tenants: Tenant[],
  unit: RentUnit = "pence",
): number {
  const propertyTenants = tenants.filter((t) => t.propertyId === property.id);

  if (propertyTenants.length === 0) {
    throw new Error(`Property ${property.id} has no tenants`);
  }

  const rentInPence = property.monthlyRentPence / propertyTenants.length;

  return unit === "pounds" ? rentInPence / 100 : rentInPence;
}

/**
 * Returns the IDs of all properties whose postcode is not a valid UK postcode.
 *
 * Validates against all six outward-code formats defined by Royal Mail:
 * AN, ANN, AAN, AANN, ANA, AANA — followed by a space and the inward code NAA.
 *
 * See: https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom
 */
export function invalidPostcodePropertyIds(properties: Property[]): string[] {
  const UK_POSTCODE_REGEX =
    /^(([A-Z][0-9]{1,2})|([A-Z][A-Z][0-9]{1,2})|([A-Z][0-9][A-Z])|([A-Z][A-Z][0-9][A-Z])|([A-Z][A-Z][0-9]{2}))\s[0-9][A-Z]{2}$/i;

  return properties
    .filter((p) => !UK_POSTCODE_REGEX.test(p.postcode.trim()))
    .map((p) => p.id);
}

/**
 * Returns the current occupancy status of a property.
 *
 * - PROPERTY_VACANT:   No tenants assigned
 * - PARTIALLY_VACANT:  Has tenants but below capacity, tenancy still active
 * - PROPERTY_ACTIVE:   At or above capacity, tenancy still active
 * - PROPERTY_OVERDUE:  Has tenants but the tenancy end date has passed
 *
 * The `today` parameter defaults to the current date and can be overridden
 * in tests to produce deterministic results.
 */
export function getPropertyStatus(
  property: Property,
  tenants: Tenant[],
  today: Date = new Date(),
): PropertyStatus {
  const propertyTenants = tenants.filter((t) => t.propertyId === property.id);

  if (propertyTenants.length === 0) {
    return "PROPERTY_VACANT";
  }

  const tenancyEndDate = new Date(property.tenancyEndDate);
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const isOverdue = todayMidnight > tenancyEndDate;

  if (isOverdue) {
    return "PROPERTY_OVERDUE";
  }

  return propertyTenants.length >= property.capacity
    ? "PROPERTY_ACTIVE"
    : "PARTIALLY_VACANT";
}
