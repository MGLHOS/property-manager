import { Property, PropertyStatus, Region, RentUnit, Tenant } from "./types";

/**
 * Requirement 1: Calculate the average rent of properties by region.
 *
 * @param properties - All properties to search within
 * @param region - The region to filter by
 * @returns The average monthly rent in pence for the given region
 */
export function averageRentByRegion(properties: Property[], region: Region): number {
  const regionProperties = properties.filter((p) => p.region === region);

  if (regionProperties.length === 0) {
    return 0;
  }

  const total = regionProperties.reduce((sum, p) => sum + p.monthlyRentPence, 0);
  return total / regionProperties.length;
}

/**
 * Requirement 2: Calculate the monthly rent per tenant for a given property.
 *
 * The total property monthly rent is split equally between tenants.
 *
 * @param property - The property to calculate rent for
 * @param tenants - All tenants (will be filtered to those belonging to the property)
 * @param unit - Whether to return the value in "pence" or "pounds"
 * @returns The monthly rent per tenant as a number
 * @throws Error if the property has no tenants
 */
export function monthlyRentPerTenant(
  property: Property,
  tenants: Tenant[],
  unit: RentUnit = "pence"
): number {
  const propertyTenants = tenants.filter((t) => t.propertyId === property.id);

  if (propertyTenants.length === 0) {
    throw new Error(`Property ${property.id} has no tenants`);
  }

  const rentInPence = property.monthlyRentPence / propertyTenants.length;

  return unit === "pounds" ? rentInPence / 100 : rentInPence;
}

/**
 * Requirement 3: Validate the postcodes of all properties.
 *
 * Validates against the official UK postcode format.
 * See: https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom
 *
 * @param properties - All properties to validate
 * @returns An array of property IDs which have an invalid postcode
 */
export function invalidPostcodePropertyIds(properties: Property[]): string[] {
  // Official UK postcode regex as defined by the UK government / Royal Mail
  // Covers all valid outward codes (AN, ANN, AAN, AANN, ANA, AANA) + space + inward code (NAA)
  const UK_POSTCODE_REGEX =
    /^(([A-Z][0-9]{1,2})|([A-Z][A-Z][0-9]{1,2})|([A-Z][0-9][A-Z])|([A-Z][A-Z][0-9][A-Z])|([A-Z][A-Z][0-9]{2}))\s[0-9][A-Z]{2}$/i;

  return properties
    .filter((p) => !UK_POSTCODE_REGEX.test(p.postcode.trim()))
    .map((p) => p.id);
}

/**
 * Requirement 4: Get the status of a property.
 *
 * - PROPERTY_VACANT:   No tenants
 * - PARTIALLY_VACANT:  Has tenants but fewer than capacity, and tenancy is not overdue
 * - PROPERTY_ACTIVE:   Has tenants, capacity is full (or no capacity limit), and tenancy is not overdue
 * - PROPERTY_OVERDUE:  Has at least one tenant but the tenancy end date has passed
 *
 * @param property - The property to evaluate
 * @param tenants - All tenants (will be filtered to those belonging to the property)
 * @param today - The reference date for overdue checks (defaults to now, injectable for testing)
 * @returns The PropertyStatus for the given property
 */
export function getPropertyStatus(
  property: Property,
  tenants: Tenant[],
  today: Date = new Date()
): PropertyStatus {
  const propertyTenants = tenants.filter((t) => t.propertyId === property.id);

  if (propertyTenants.length === 0) {
    return "PROPERTY_VACANT";
  }

  const tenancyEndDate = new Date(property.tenancyEndDate);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isOverdue = todayMidnight > tenancyEndDate;

  if (isOverdue) {
    return "PROPERTY_OVERDUE";
  }

  const isFull = propertyTenants.length >= property.capacity;

  return isFull ? "PROPERTY_ACTIVE" : "PARTIALLY_VACANT";
}
