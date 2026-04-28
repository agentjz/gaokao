import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validationRoot } from "../src/paths.js";

export interface ChoiceAnswer {
  questionId: string;
  optionIds: string[];
}

interface ChoiceAnswerKeyFile {
  answers: ChoiceAnswer[];
}

let cachedChoiceAnswers: ChoiceAnswer[] | undefined;

export function loadChoiceAnswers(): ChoiceAnswer[] {
  cachedChoiceAnswers ??= validateChoiceAnswerKey(
    JSON.parse(readFileSync(join(validationRoot, "choice", "answer-key.json"), "utf8")) as ChoiceAnswerKeyFile
  );
  return cachedChoiceAnswers;
}

export function loadChoiceAnswer(questionId: string): ChoiceAnswer {
  const answer = loadChoiceAnswers().find((item) => item.questionId === questionId);
  if (!answer) throw new Error(`missing choice answer: ${questionId}`);
  return answer;
}

function validateChoiceAnswerKey(input: ChoiceAnswerKeyFile): ChoiceAnswer[] {
  if (!Array.isArray(input.answers)) throw new Error("choice answer-key.json must contain an answers array");
  const seen = new Set<string>();
  for (const answer of input.answers) {
    if (typeof answer.questionId !== "string" || !answer.questionId) throw new Error("choice answer missing questionId");
    if (seen.has(answer.questionId)) throw new Error(`duplicate choice answer: ${answer.questionId}`);
    if (!Array.isArray(answer.optionIds) || answer.optionIds.length === 0) throw new Error(`choice answer missing optionIds: ${answer.questionId}`);
    for (const optionId of answer.optionIds) {
      if (typeof optionId !== "string" || !optionId) throw new Error(`choice option id must be string: ${answer.questionId}`);
    }
    seen.add(answer.questionId);
  }
  return input.answers;
}
