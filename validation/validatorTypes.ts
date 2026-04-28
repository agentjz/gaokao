import type { ExamSession, Question, SubmittedAnswer } from "../src/types.js";

export interface TaskValidatorInput {
  question: Question;
  submitted: SubmittedAnswer;
  answer: unknown;
  session: ExamSession;
  workspaceRoot: string;
  taskWorkspace: string;
}

export interface TaskValidatorResult {
  passed: boolean;
  notes?: string[];
  evidence?: string[];
}

export type TaskValidator = (input: TaskValidatorInput) => TaskValidatorResult | Promise<TaskValidatorResult>;
