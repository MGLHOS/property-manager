export type Region = "ENGLAND" | "SCOTLAND" | "WALES" | "N.IRELAND";

export interface Property {
  id: string;
  address: string;
  postcode: string;
  monthlyRentPence: number;
  region: Region;
  capacity: number;
  tenancyEndDate: string; // ISO date string YYYY-MM-DD
}

export interface Tenant {
  id: string;
  propertyId: string;
  name: string;
}

export type RentUnit = "pence" | "pounds";

export type PropertyStatus =
  | "PROPERTY_VACANT"
  | "PARTIALLY_VACANT"
  | "PROPERTY_ACTIVE"
  | "PROPERTY_OVERDUE";
