import { randomBytes } from "node:crypto";
import { initialHash, nextHash } from "./hash.js";
import { getQuestion, loadMbtiQuestions, publicQuestion } from "./bank.js";
import { buildResult } from "./result.js";
import { buildReport, writeReportFiles } from "./report.js";
import { loadSession, saveSession } from "./store.js";
import type { MbtiAnswer, MbtiSession, PublicMbtiQuestion, RawMbtiQuestion } from "./types.js";

const batchSize = 6;

export function startMbti(input: { agentName?: string; model?: string }): { sessionId: string; hash: string; batch: PublicMbtiQuestion[]; batchSize: number; totalQuestions: number; totalBatches: number } {
  const questions = shuffle(loadMbtiQuestions());
  const sessionId = `mbti-${randomBytes(4).toString("hex")}`;
  const session: MbtiSession = {
    sessionId,
    agentName: input.agentName || "unknown-agent",
    model: input.model,
    status: "in_progress",
    hash: initialHash(),
    batchIndex: 0,
    batchSize,
    questionIds: questions.map((question) => question.id),
    answers: [],
    createdAt: new Date().toISOString()
  };
  saveSession(session);
  return {
    sessionId,
    hash: session.hash,
    batch: currentBatch(session).map(publicQuestion),
    batchSize,
    totalQuestions: session.questionIds.length,
    totalBatches: Math.ceil(session.questionIds.length / batchSize)
  };
}

export function mbtiStatus(sessionId: string): MbtiSession & { batch: PublicMbtiQuestion[] } {
  const session = loadSession(sessionId);
  return { ...session, batch: session.status === "completed" ? [] : currentBatch(session).map(publicQuestion) };
}

export function answerMbtiBatch(input: { sessionId: string; hash: string; answers: Array<{ questionId: string; answer: { optionId?: string } | string }> }): Record<string, unknown> {
  const session = loadSession(input.sessionId);
  if (session.status === "completed") return completionPayload(session);
  if (input.hash !== session.hash) throw new Error("invalid hash");

  const batch = currentBatch(session);
  const expectedIds = batch.map((question) => question.id);
  const gotIds = input.answers.map((answer) => answer.questionId);
  if (JSON.stringify(expectedIds) !== JSON.stringify(gotIds)) throw new Error(`answers must match current batch: ${expectedIds.join(", ")}`);

  session.answers.push(...input.answers.map((answer) => normalizeAnswer(getQuestion(answer.questionId), answer.answer)));
  session.batchIndex += 1;
  session.hash = nextHash(session.hash, input.answers);
  if (session.answers.length >= session.questionIds.length) {
    session.status = "completed";
    session.completedAt = new Date().toISOString();
    session.result = buildResult(session.answers);
  }
  saveSession(session);
  return session.status === "completed"
    ? completionPayload(session)
    : {
        hash: session.hash,
        nextBatch: currentBatch(session).map(publicQuestion),
        progress: { current: session.answers.length, total: session.questionIds.length }
      };
}

function normalizeAnswer(question: RawMbtiQuestion, answer: { optionId?: string } | string): MbtiAnswer {
  const optionId = typeof answer === "string" ? answer : answer.optionId;
  if (optionId !== "A" && optionId !== "B") throw new Error(`invalid optionId for ${question.id}`);
  return {
    questionId: question.id,
    optionId,
    value: optionId === "A" ? question.choice_a.value : question.choice_b.value
  };
}

function currentBatch(session: MbtiSession): RawMbtiQuestion[] {
  return session.questionIds.slice(session.batchIndex * batchSize, session.batchIndex * batchSize + batchSize).map(getQuestion);
}

function completionPayload(session: MbtiSession): Record<string, unknown> {
  const report = buildReport(session.sessionId);
  const reportFiles = writeReportFiles(session.sessionId);
  return {
    testComplete: true,
    resultType: report.result.resultType,
    dimensions: report.result.dimensions,
    reportUrl: `/report?id=${session.sessionId}`,
    reportFiles,
    shutdownUrl: "/api/server/shutdown",
    progress: { current: session.answers.length, total: session.questionIds.length }
  };
}

function shuffle<T>(items: T[]): T[] {
  return [...items]
    .map((item) => ({ item, key: randomBytes(8).toString("hex") }))
    .sort((left, right) => left.key.localeCompare(right.key))
    .map(({ item }) => item);
}
