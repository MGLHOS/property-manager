import { readFileSync } from "fs";
import { join } from "path";
import { Property, Tenant } from "./types";

const DATA_DIR = join(__dirname, "..", "data");

function parseCsv<T>(
  filename: string,
  transform: (row: Record<string, string>) => T,
): T[] {
  const content = readFileSync(join(DATA_DIR, filename), "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header.trim()] = (values[i] ?? "").trim();
    });
    return transform(row);
  });
}

export function loadProperties(): Property[] {
  return parseCsv("properties.csv", (row) => ({
    id: row.id,
    address: row.address,
    postcode: row.postcode,
    monthlyRentPence: parseInt(row.monthlyRentPence, 10),
    region: row.region as Property["region"],
    capacity: parseInt(row.capacity, 10),
    tenancyEndDate: row.tenancyEndDate,
  }));
}

export function loadTenants(): Tenant[] {
  return parseCsv("tenants.csv", (row) => ({
    id: row.id,
    propertyId: row.propertyId,
    name: row.name,
  }));
}
