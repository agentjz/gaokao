export type MbtiLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export interface RawMbtiQuestion {
  id: string;
  question: string;
  choice_a: { value: MbtiLetter; text: string };
  choice_b: { value: MbtiLetter; text: string };
}

export interface PublicMbtiQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: "A" | "B"; text: string }>;
}

export interface MbtiProfile {
  type: string;
  subtitle: string;
  description: string;
  contentHtml: string;
}

export interface MbtiAnswer {
  questionId: string;
  optionId: "A" | "B";
  value: MbtiLetter;
}

export interface MbtiDimension {
  pair: string;
  left: MbtiLetter;
  leftCount: number;
  right: MbtiLetter;
  rightCount: number;
  selected: MbtiLetter;
  strength: number;
}

export interface MbtiResult {
  resultType: string;
  dimensions: MbtiDimension[];
  counts: Record<MbtiLetter, number>;
  profile: MbtiProfile | null;
  agentProfile: string[];
}

export interface MbtiSession {
  sessionId: string;
  agentName: string;
  model?: string;
  status: "in_progress" | "completed";
  hash: string;
  batchIndex: number;
  batchSize: number;
  questionIds: string[];
  answers: MbtiAnswer[];
  result?: MbtiResult;
  createdAt: string;
  completedAt?: string;
}
