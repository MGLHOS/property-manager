import { Property, PropertyStatus, Region, RentUnit, Tenant } from "./types";

function toUnit(pence: number, unit: RentUnit): number {
  return unit === "pounds" ? pence / 100 : pence;
}

function validateProperty(property: Property): void {
  if (!property.id) throw new Error("Property must have an id");
  if (
    !Number.isFinite(property.monthlyRentPence) ||
    property.monthlyRentPence < 0
  )
    throw new Error(`Property ${property.id} has an invalid monthlyRentPence`);
  if (!Number.isInteger(property.capacity) || property.capacity < 1)
    throw new Error(`Property ${property.id} has an invalid capacity`);
  if (
    !property.tenancyEndDate ||
    isNaN(new Date(property.tenancyEndDate).getTime())
  )
    throw new Error(`Property ${property.id} has an invalid tenancyEndDate`);
}

export function averageRentByRegion(
  properties: Property[],
  region: Region,
  unit: RentUnit = "pence",
): number {
  const regionProperties = properties.filter((p) => p.region === region);

  if (regionProperties.length === 0) return 0;

  regionProperties.forEach(validateProperty);

  const totalPence = regionProperties.reduce(
    (sum, p) => sum + p.monthlyRentPence,
    0,
  );
  return toUnit(totalPence / regionProperties.length, unit);
}

export function monthlyRentPerTenant(
  property: Property,
  tenants: Tenant[],
  unit: RentUnit = "pence",
): number {
  validateProperty(property);

  const propertyTenants = tenants.filter((t) => t.propertyId === property.id);

  if (propertyTenants.length === 0) {
    throw new Error(`Property ${property.id} has no tenants`);
  }

  // Distribute rent as evenly as possible in whole pence.
  // The remainder (if any) is assigned to the first tenant.
  const baseShare = Math.floor(
    property.monthlyRentPence / propertyTenants.length,
  );

  // Return the base share — callers wanting the precise per-tenant
  // breakdown should request individual shares rather than an average.
  return toUnit(baseShare, unit);
}

export function invalidPostcodePropertyIds(properties: Property[]): string[] {
  const UK_POSTCODE_REGEX =
    /^(([A-Z][0-9]{1,2})|([A-Z][A-Z][0-9]{1,2})|([A-Z][0-9][A-Z])|([A-Z][A-Z][0-9][A-Z])|([A-Z][A-Z][0-9]{2}))\s[0-9][A-Z]{2}$/i;

  return properties
    .filter((p) => !UK_POSTCODE_REGEX.test(p.postcode.trim()))
    .map((p) => p.id);
}

export function getPropertyStatus(
  property: Property,
  tenants: Tenant[],
  today: Date = new Date(),
): PropertyStatus {
  validateProperty(property);

  const propertyTenants = tenants.filter((t) => t.propertyId === property.id);

  if (propertyTenants.length === 0) return "PROPERTY_VACANT";

  const tenancyEndDate = new Date(property.tenancyEndDate);
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (todayMidnight > tenancyEndDate) return "PROPERTY_OVERDUE";

  return propertyTenants.length >= property.capacity
    ? "PROPERTY_ACTIVE"
    : "PARTIALLY_VACANT";
}
