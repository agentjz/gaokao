import { createHash, randomBytes } from "node:crypto";

export function initialHash(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

export function nextHash(previous: string, payload: unknown): string {
  return createHash("sha256").update(previous).update(JSON.stringify(payload)).digest("hex");
}
