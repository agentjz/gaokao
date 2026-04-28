import { taskTypes, type ChoiceMode, type Question, type TaskType } from "../src/types.js";

const forbiddenPublicFields = ["answer", "answers", "expected", "rubric", "score", "scoring", "validation"];
const validTypes = new Set(taskTypes);
const validSkills = new Set(["understanding", "execution", "retrieval", "reasoning", "reflection", "tooling", "eq", "memory"]);

export function validatePublicTask(raw: Record<string, unknown>, path: string, type: TaskType, number: string): Question {
  for (const field of forbiddenPublicFields) {
    if (field in raw) throw new Error(`public task leaks private field "${field}": ${path}`);
  }
  if (!validTypes.has(type)) throw new Error(`task path uses unsupported type: ${path}`);
  if (typeof raw.title !== "string") throw new Error(`task missing title: ${path}`);
  if (!Array.isArray(raw.skills) || raw.skills.length === 0) throw new Error(`task missing skills: ${path}`);
  for (const skill of raw.skills) {
    if (typeof skill !== "string" || !validSkills.has(skill)) throw new Error(`task has invalid skill: ${path}`);
  }
  if (typeof raw.prompt !== "string") throw new Error(`task missing prompt: ${path}`);
  if (typeof raw.timeLimit !== "number") throw new Error(`task missing timeLimit: ${path}`);
  const id = `${type}-${number}`;
  const base = { ...raw, id, type, number } as Record<string, unknown>;
  if (type !== "choice") return base as unknown as Question;
  if (raw.choiceMode !== "single" && raw.choiceMode !== "multiple") throw new Error(`choice task missing choiceMode: ${path}`);
  if (!Array.isArray(raw.options) || raw.options.length < 2) throw new Error(`task needs at least two options: ${path}`);
  const optionIds = new Set<string>();
  for (const option of raw.options) {
    if (!option || typeof option !== "object") throw new Error(`task option must be object: ${path}`);
    const item = option as Record<string, unknown>;
    if (typeof item.id !== "string" || !item.id) throw new Error(`task option missing id: ${path}`);
    if (typeof item.text !== "string" || !item.text) throw new Error(`task option missing text: ${path}`);
    if (optionIds.has(item.id)) throw new Error(`task option id duplicated: ${path}`);
    optionIds.add(item.id);
  }
  base.choiceMode = raw.choiceMode as ChoiceMode;
  return base as unknown as Question;
}
