import { withBasePath } from "./basePath";


function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}


export function validateSchemaFields(value: unknown): string[] {
  const source = objectValue(value, "schema");
  if (!Array.isArray(source.fields)) throw new Error("Dataset schema fields must be an array");
  const fields = source.fields.map((item, index) => {
    const field = objectValue(item, `fields[${index}]`);
    if (typeof field.name !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(field.name)) {
      throw new Error(`Invalid schema field name at fields[${index}]`);
    }
    return field.name;
  });
  if (!fields.length || new Set(fields).size !== fields.length) throw new Error("Dataset schema fields must be unique");
  return fields;
}


export async function fetchSchemaFields(basePath = "", signal?: AbortSignal): Promise<string[]> {
  const response = await fetch(withBasePath("/data/schema.json", basePath), { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load dataset schema (${response.status})`);
  return validateSchemaFields(await response.json());
}
