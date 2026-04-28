import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { initialHash, nextHash } from "./hash.js";
import { grade } from "../scoring/grader.js";
import { loadExamConfig } from "./config.js";
import { loadQuestions, publicQuestion, getQuestion } from "./taskbank.js";
import { workspacesDir } from "./paths.js";
import { loadSession, saveSession } from "./store.js";
import { buildReport, writeReportFiles } from "./report.js";
import { taskTypes, type ExamSession, type SubmittedAnswer } from "./types.js";

const batchSize = 2;

export function startExam(input: { agentName?: string; model?: string }): { examId: string; hash: string; batch: unknown[]; batchSize: number; totalQuestions: number; totalBatches: number } {
  const questions = selectQuestions(loadQuestions());
  const examId = `exam-${randomBytes(4).toString("hex")}`;
  const workspaceDir = join(workspacesDir, examId);
  mkdirSync(workspaceDir, { recursive: true });
  const session: ExamSession = {
    examId,
    agentName: input.agentName || "unknown-agent",
    model: input.model,
    status: "in_progress",
    hash: initialHash(),
    batchIndex: 0,
    batchSize,
    questionIds: questions.map((question) => question.id),
    workspaceDir,
    results: [],
    createdAt: new Date().toISOString()
  };
  saveSession(session);
  return {
    examId,
    hash: session.hash,
    batch: currentBatch(session).map((question) => publicQuestion(question, session.workspaceDir)),
    batchSize,
    totalQuestions: questions.length,
    totalBatches: Math.ceil(questions.length / batchSize)
  };
}

export function examStatus(examId: string): ExamSession & { batch: unknown[] } {
  const session = loadSession(examId);
  return { ...session, batch: session.status === "completed" ? [] : currentBatch(session).map((question) => publicQuestion(question, session.workspaceDir)) };
}

export async function answerBatch(input: { examId: string; hash: string; answers: SubmittedAnswer[] }): Promise<Record<string, unknown>> {
  const session = loadSession(input.examId);
  if (session.status === "completed") return completionPayload(session);
  if (input.hash !== session.hash) throw new Error("invalid hash");

  const batch = currentBatch(session);
  const expectedIds = batch.map((question) => question.id);
  const gotIds = input.answers.map((answer) => answer.questionId);
  if (JSON.stringify(expectedIds) !== JSON.stringify(gotIds)) {
    throw new Error(`answers must match current batch: ${expectedIds.join(", ")}`);
  }

  for (const answer of input.answers) {
    session.results.push(await grade(getQuestion(answer.questionId), answer, session));
  }
  session.batchIndex += 1;
  session.hash = nextHash(session.hash, input.answers);
  if (session.results.length >= session.questionIds.length) {
    session.status = "completed";
    session.completedAt = new Date().toISOString();
  }
  saveSession(session);
  return session.status === "completed"
    ? completionPayload(session)
    : {
        hash: session.hash,
        nextBatch: currentBatch(session).map((question) => publicQuestion(question, session.workspaceDir)),
        progress: { current: session.results.length, total: session.questionIds.length }
      };
}

function currentBatch(session: ExamSession) {
  const ids = session.questionIds.slice(session.batchIndex * batchSize, session.batchIndex * batchSize + batchSize);
  return ids.map(getQuestion);
}

function selectQuestions(questions: ReturnType<typeof loadQuestions>) {
  const config = loadExamConfig();
  const selected = [];
  for (const type of taskTypes) {
    const available = questions.filter((question) => question.type === type);
    const requested = config.questionsPerType[type];
    if (available.length < requested) {
      throw new Error(`not enough ${type} tasks: requested ${requested}, found ${available.length}`);
    }
    selected.push(...shuffle(available).slice(0, requested));
  }
  return selected.sort((a, b) => a.type.localeCompare(b.type) || a.number.localeCompare(b.number));
}

function shuffle<T>(items: T[]): T[] {
  return [...items]
    .map((item) => ({ item, key: randomBytes(8).toString("hex") }))
    .sort((left, right) => left.key.localeCompare(right.key))
    .map(({ item }) => item);
}

function completionPayload(session: ExamSession): Record<string, unknown> {
  const report = buildReport(session.examId);
  const reportFiles = writeReportFiles(session.examId);
  return {
    examComplete: true,
    grade: report.grade,
    score: report.score,
    reportUrl: `/report?id=${session.examId}`,
    reportFiles,
    shutdownUrl: "/api/server/shutdown",
    progress: { current: session.results.length, total: session.questionIds.length }
  };
}
