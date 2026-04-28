import { readJson } from "./json.js";
import { profilesPath, questionsPath } from "./paths.js";
import type { MbtiProfile, PublicMbtiQuestion, RawMbtiQuestion } from "./types.js";

interface QuestionFile {
  questions: RawMbtiQuestion[];
  questionOrder?: string[];
}

interface ProfileFile {
  personalities: MbtiProfile[];
}

let cachedQuestions: RawMbtiQuestion[] | undefined;
let cachedProfiles: MbtiProfile[] | undefined;

export function loadMbtiQuestions(): RawMbtiQuestion[] {
  cachedQuestions ??= readJson<QuestionFile>(questionsPath).questions.filter(isQuestion);
  return cachedQuestions;
}

export function loadMbtiProfiles(): MbtiProfile[] {
  cachedProfiles ??= readJson<ProfileFile>(profilesPath).personalities.filter(isProfile);
  return cachedProfiles;
}

export function getQuestion(id: string): RawMbtiQuestion {
  const question = loadMbtiQuestions().find((item) => item.id === id);
  if (!question) throw new Error(`Unknown MBTI question: ${id}`);
  return question;
}

export function publicQuestion(question: RawMbtiQuestion): PublicMbtiQuestion {
  return {
    id: question.id,
    prompt: question.question,
    options: [
      { id: "A", text: question.choice_a.text },
      { id: "B", text: question.choice_b.text }
    ]
  };
}

export function getProfile(type: string): MbtiProfile | null {
  return loadMbtiProfiles().find((profile) => profile.type === type) ?? null;
}

function isQuestion(value: unknown): value is RawMbtiQuestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RawMbtiQuestion>;
  return (
    typeof item.id === "string" &&
    typeof item.question === "string" &&
    isChoice(item.choice_a) &&
    isChoice(item.choice_b)
  );
}

function isChoice(value: unknown): value is RawMbtiQuestion["choice_a"] {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.value === "string" && typeof item.text === "string";
}

function isProfile(value: unknown): value is MbtiProfile {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MbtiProfile>;
  return typeof item.type === "string" && typeof item.subtitle === "string" && typeof item.description === "string";
}
