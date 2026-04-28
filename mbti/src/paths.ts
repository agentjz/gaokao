import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));

export const projectRoot = moduleDir.includes(`${join("dist", "mbti", "src")}`)
  ? resolve(moduleDir, "..", "..", "..", "mbti")
  : resolve(moduleDir, "..");

export const dataDir = join(projectRoot, "data");
export const questionsPath = join(dataDir, "questions.json");
export const profilesPath = join(dataDir, "profiles.raw.json");
export const stateDir = join(resolve(projectRoot, ".."), ".mbti");
export const sessionsDir = join(stateDir, "sessions");
export const reportsDir = join(stateDir, "reports");

export function ensureState(): void {
  mkdirSync(sessionsDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });
}
