import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import type { ExamSession, Question, QuestionResult, SubmittedAnswer } from "../src/types.js";
import { loadChoiceAnswer } from "../validation/loadValidation.js";
import type { TaskValidator, TaskValidatorResult } from "../validation/validatorTypes.js";

const moduleDir = dirname(fileURLToPath(import.meta.url));

export async function grade(question: Question, submitted: SubmittedAnswer, session: ExamSession): Promise<QuestionResult> {
  const result = question.type === "choice" ? gradeChoice(question, submitted.answer) : await gradeWithTaskValidator(question, submitted, session);
  const notes = result.notes ?? [];
  if (!result.passed && notes.length === 0) notes.push("Answer did not match the grading evidence.");

  return {
    questionId: question.id,
    type: question.type,
    skills: question.skills,
    score: result.passed ? 100 : 0,
    passed: result.passed,
    notes,
    evidence: result.evidence ?? [],
    answer: submitted.answer
  };
}

function gradeChoice(question: Question, answer: unknown): TaskValidatorResult {
  if (!question.choiceMode) throw new Error(`choice task missing choiceMode: ${question.id}`);
  const selected = normalizeStringArray(field(answer, "optionIds")).sort();
  const correct = [...loadChoiceAnswer(question.id).optionIds].sort();
  const notes: string[] = [];

  if (question.choiceMode === "single" && correct.length !== 1) {
    throw new Error(`single choice answer key must have exactly one answer: ${question.id}`);
  }
  if (question.choiceMode === "single" && selected.length !== 1) {
    notes.push("Single choice tasks require exactly one selected option.");
  }

  const legalOptionIds = new Set((question.options ?? []).map((option) => option.id));
  for (const optionId of selected) {
    if (!legalOptionIds.has(optionId)) notes.push(`Unknown option: ${optionId}`);
  }
  for (const optionId of correct) {
    if (!legalOptionIds.has(optionId)) throw new Error(`answer key references unknown option: ${question.id}/${optionId}`);
  }

  return {
    passed: notes.length === 0 && deepEqual(selected, correct),
    notes,
    evidence: ["Validated against the shared choice answer key."]
  };
}

async function gradeWithTaskValidator(question: Question, submitted: SubmittedAnswer, session: ExamSession): Promise<TaskValidatorResult> {
  const taskWorkspace = join(session.workspaceDir, question.type, question.number);
  const validatorPath = join(moduleDir, "..", "validation", question.type, question.number, "validator.js");
  if (!existsSync(validatorPath)) throw new Error(`missing task validator: ${question.id}`);

  const module = (await import(pathToFileURL(validatorPath).href)) as { validate?: TaskValidator };
  if (typeof module.validate !== "function") throw new Error(`validator must export validate(): ${question.id}`);

  return module.validate({
    question,
    submitted,
    answer: submitted.answer,
    session,
    workspaceRoot: session.workspaceDir,
    taskWorkspace
  });
}

function field(input: unknown, name: string): unknown {
  if (!input || typeof input !== "object") return undefined;
  return (input as Record<string, unknown>)[name];
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === "string");
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
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
