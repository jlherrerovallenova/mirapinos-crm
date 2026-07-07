// src/utils/formatName.ts

/**
 * Normalizes a client's name. If the name is written entirely in uppercase 
 * or entirely in lowercase, it converts it to Title Case (first letter of each
 * name and surname capitalized, and the rest in lowercase).
 * Otherwise, if it has mixed case, it leaves it unchanged.
 */
export function formatClientName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';

  const isAllUppercase = trimmed === trimmed.toUpperCase();
  const isAllLowercase = trimmed === trimmed.toLowerCase();

  if (isAllUppercase || isAllLowercase) {
    return trimmed
      .toLowerCase()
      .replace(/(?:^|[\s-])\S/g, (match) => match.toUpperCase());
  }

  return trimmed;
}
