import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureState, sessionsDir } from "./paths.js";
import { readJson, writeJson } from "./json.js";
import type { MbtiSession } from "./types.js";

export function sessionPath(sessionId: string): string {
  return join(sessionsDir, `${sessionId}.json`);
}

export function saveSession(session: MbtiSession): void {
  ensureState();
  writeJson(sessionPath(session.sessionId), session);
}

export function loadSession(sessionId: string): MbtiSession {
  const path = sessionPath(sessionId);
  if (!existsSync(path)) throw new Error("mbti session not found");
  return readJson<MbtiSession>(path);
}
