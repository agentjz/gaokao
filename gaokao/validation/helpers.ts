import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function field(input: unknown, name: string): unknown {
  if (!input || typeof input !== "object") return undefined;
  return (input as Record<string, unknown>)[name];
}

export function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

export function readJsonArtifact(taskWorkspace: string, fileName: string): { ok: true; value: unknown; path: string } | { ok: false; error: string; path: string } {
  const path = join(taskWorkspace, fileName);
  if (!existsSync(path)) return { ok: false, error: `Missing required file: ${path}`, path };
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, "utf8")) as unknown, path };
  } catch (error) {
    return { ok: false, error: `File is not valid JSON: ${path}; ${error instanceof Error ? error.message : String(error)}`, path };
  }
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)])
    );
  }
  return value;
}
