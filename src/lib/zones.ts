/**
 * Schengen Area member states (ISO 3166-1 alpha-2 codes).
 * As of 2025, 29 member states.
 */
export const SCHENGEN_CODES = new Set<string>([
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IS", // Iceland
  "IT", // Italy
  "LV", // Latvia
  "LI", // Liechtenstein
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "NO", // Norway
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  "CH", // Switzerland
]);

/** Pseudo-country code used in filters / calculations for Schengen zone. */
export const ZONE_SCHENGEN = "__schengen__";

/** Check if a country code belongs to the Schengen Area. */
export function isSchengen(code: string): boolean {
  return SCHENGEN_CODES.has(code.toUpperCase().trim());
}

/** Get all Schengen country codes as an array. */
export function getSchengenCodes(): string[] {
  return Array.from(SCHENGEN_CODES);
}
