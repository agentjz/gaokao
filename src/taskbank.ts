import { mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { taskRoot } from "./paths.js";
import { validatePublicTask } from "../validation/validateTask.js";
import type { PublicQuestion, Question, TaskType } from "./types.js";

const numberedTaskPath = /[\\/]tasks[\\/]([a-z_]+)[\\/](\d{2})[\\/]task\.json$/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walk(path));
    if (stat.isFile() && entry === "task.json") out.push(path);
  }
  return out;
}

export function loadQuestions(): Question[] {
  return walk(taskRoot)
    .map((path) => {
      const match = path.match(numberedTaskPath);
      if (!match) throw new Error(`task must live at tasks/<type>/<number>/task.json: ${path}`);
      const [, type, number] = match;
      return validatePublicTask(JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>, path, type as TaskType, number);
    })
    .sort((a, b) => a.type.localeCompare(b.type) || a.number.localeCompare(b.number));
}

export function publicQuestion(question: Question, workspaceRoot: string): PublicQuestion {
  const taskWorkspace = join(workspaceRoot, question.type, question.number);
  mkdirSync(taskWorkspace, { recursive: true });
  return {
    id: question.id,
    type: question.type,
    number: question.number,
    title: question.title,
    skills: question.skills,
    prompt: interpolatePrompt(question.prompt, workspaceRoot, taskWorkspace),
    timeLimit: question.timeLimit,
    choiceMode: question.choiceMode,
    options: question.options,
    workspace: question.type === "file_artifact" ? { root: workspaceRoot, task: taskWorkspace } : undefined
  };
}

export function getQuestion(id: string): Question {
  const question = loadQuestions().find((item) => item.id === id);
  if (!question) throw new Error(`Unknown question: ${id}`);
  return question;
}

function interpolatePrompt(prompt: string, workspaceRoot: string, taskWorkspace: string): string {
  return prompt.replaceAll("{workspaceRoot}", workspaceRoot).replaceAll("{taskWorkspace}", taskWorkspace);
}
