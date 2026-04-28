import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));

export const projectRoot = moduleDir.includes(`${join("dist", "gaokao", "src")}`)
  ? resolve(moduleDir, "..", "..", "..", "gaokao")
  : resolve(moduleDir, "..");

export const stateDir = join(resolve(projectRoot, ".."), ".gaokao");
export const sessionsDir = join(stateDir, "sessions");
export const reportsDir = join(stateDir, "reports");
export const workspacesDir = join(stateDir, "workspaces");
export const taskRoot = join(projectRoot, "tasks");
export const validationRoot = join(projectRoot, "validation");
export const configPath = join(projectRoot, "config.json");

export function ensureState(): void {
  mkdirSync(sessionsDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(workspacesDir, { recursive: true });
}
