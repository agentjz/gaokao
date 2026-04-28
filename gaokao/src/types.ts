export type Capability =
  | "understanding"
  | "execution"
  | "retrieval"
  | "reasoning"
  | "reflection"
  | "tooling"
  | "eq"
  | "memory";

export const taskTypes = [
  "choice",
  "exact_answer",
  "structured_answer",
  "ordering",
  "matching",
  "file_artifact"
] as const;

export type TaskType = (typeof taskTypes)[number];

export type ChoiceMode = "single" | "multiple";

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: TaskType;
  number: string;
  title: string;
  skills: Capability[];
  prompt: string;
  timeLimit: number;
  choiceMode?: ChoiceMode;
  options?: ChoiceOption[];
}

export interface PublicQuestion {
  id: string;
  type: TaskType;
  number: string;
  title: string;
  skills: Capability[];
  prompt: string;
  timeLimit: number;
  choiceMode?: ChoiceMode;
  options?: ChoiceOption[];
  workspace?: {
    root: string;
    task: string;
  };
}

export interface AnswerTrace {
  summary?: string;
  steps?: string[];
  tools_used?: string[];
  assumptions?: string[];
  confidence?: number;
  uncertainty?: string;
  time_taken_seconds?: number;
}

export interface SubmittedAnswer {
  questionId: string;
  answer: unknown;
  trace?: AnswerTrace;
}

export interface QuestionResult {
  questionId: string;
  type: TaskType;
  skills: Capability[];
  score: number;
  passed: boolean;
  notes: string[];
  evidence?: string[];
  answer?: unknown;
}

export interface ExamSession {
  examId: string;
  agentName: string;
  model?: string;
  status: "in_progress" | "completed";
  hash: string;
  batchIndex: number;
  batchSize: number;
  questionIds: string[];
  workspaceDir: string;
  results: QuestionResult[];
  createdAt: string;
  completedAt?: string;
}
