import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureState, sessionsDir } from "./paths.js";
import { readJson, writeJson } from "./json.js";
import type { ExamSession } from "./types.js";

export function sessionPath(examId: string): string {
  return join(sessionsDir, `${examId}.json`);
}

export function saveSession(session: ExamSession): void {
  ensureState();
  writeJson(sessionPath(session.examId), session);
}

export function loadSession(examId: string): ExamSession {
  const path = sessionPath(examId);
  if (!existsSync(path)) throw new Error("exam not found");
  return readJson<ExamSession>(path);
}
