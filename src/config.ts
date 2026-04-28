import { readFileSync } from "node:fs";
import { configPath } from "./paths.js";
import { taskTypes, type TaskType } from "./types.js";

export interface ExamConfig {
  questionsPerType: Record<TaskType, number>;
}

interface RawConfig {
  exam?: {
    questionsPerType?: Partial<Record<TaskType, unknown>>;
  };
}

let cachedConfig: ExamConfig | undefined;

export function loadExamConfig(): ExamConfig {
  cachedConfig ??= validateConfig(JSON.parse(readFileSync(configPath, "utf8")) as RawConfig);
  return cachedConfig;
}

function validateConfig(raw: RawConfig): ExamConfig {
  const questionsPerType = raw.exam?.questionsPerType;
  if (!questionsPerType || typeof questionsPerType !== "object") {
    throw new Error("config.json must define exam.questionsPerType");
  }

  const normalized = {} as Record<TaskType, number>;
  for (const type of taskTypes) {
    const value = questionsPerType[type];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
      throw new Error(`config.json exam.questionsPerType.${type} must be a positive integer`);
    }
    normalized[type] = value;
  }
  return { questionsPerType: normalized };
}
