import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { projectRoot, taskRoot, validationRoot } from "../src/paths.js";
import { loadExamConfig } from "../src/config.js";
import { loadQuestions } from "../src/taskbank.js";
import { taskTypes } from "../src/types.js";
import { loadChoiceAnswers } from "../validation/loadValidation.js";

test("public tasks do not contain private validation data or mojibake placeholders", () => {
  for (const path of walk(taskRoot, ".json")) {
    const text = readFileSync(path, "utf8");
    assert.equal(text.includes("????"), false, `${path} contains mojibake placeholders`);
    const raw = JSON.parse(text) as Record<string, unknown>;
    for (const privateField of ["answer", "answers", "expected", "rubric", "score", "scoring", "validation"]) {
      assert.equal(privateField in raw, false, `${path} leaks ${privateField}`);
    }
  }
});

test("task bank is organized by validation type and numbered task folders", () => {
  for (const path of walk(taskRoot, ".json")) {
    assert.match(path, /[\\/]tasks[\\/][a-z_]+[\\/]\d{2}[\\/]task\.json$/);
  }

  const questions = loadQuestions();
  for (const type of taskTypes) {
    const count = questions.filter((question) => question.type === type).length;
    assert.ok(count >= 5, `${type} must have at least 5 tasks`);
  }

  for (const question of questions) {
    assert.equal(question.id, `${question.type}-${question.number}`);
    assert.ok(question.skills.length > 0, `${question.id} must have capability tags`);
  }
});

test("exam config samples a valid number from every task type", () => {
  const config = loadExamConfig();
  const questions = loadQuestions();
  const example = JSON.parse(readFileSync(join(projectRoot, "config.example.json"), "utf8"));
  const actual = JSON.parse(readFileSync(join(projectRoot, "config.json"), "utf8"));
  assert.deepEqual(Object.keys(actual.exam.questionsPerType).sort(), Object.keys(example.exam.questionsPerType).sort());

  for (const type of taskTypes) {
    const available = questions.filter((question) => question.type === type).length;
    assert.equal(config.questionsPerType[type], 3, `${type} default sample size should be 3`);
    assert.ok(config.questionsPerType[type] <= available, `${type} sample size exceeds available tasks`);
  }
});

test("choice tasks use the shared choice answer key", () => {
  const choiceQuestions = loadQuestions().filter((question) => question.type === "choice");
  const answers = loadChoiceAnswers();
  assert.deepEqual(
    answers.map((answer) => answer.questionId).sort(),
    choiceQuestions.map((question) => question.id).sort()
  );

  for (const question of choiceQuestions) {
    assert.ok(question.options);
    assert.ok(question.options.length >= 2);
    const answer = answers.find((item) => item.questionId === question.id);
    assert.ok(answer, `missing choice answer: ${question.id}`);
    if (question.choiceMode === "single") assert.equal(answer.optionIds.length, 1);
    const optionIds = new Set(question.options.map((option) => option.id));
    for (const optionId of answer.optionIds) {
      assert.equal(optionIds.has(optionId), true, `${question.id} answer key references unknown option ${optionId}`);
    }
  }
});

test("non-choice tasks have one validator per numbered task", () => {
  for (const question of loadQuestions().filter((item) => item.type !== "choice")) {
    const validatorPath = join(validationRoot, question.type, question.number, "validator.ts");
    assert.equal(existsSync(validatorPath), true, `${question.id} missing one-task validator`);
  }
});

test("validation layout mirrors the task validation types", () => {
  for (const path of walk(validationRoot, ".ts")) {
    const relative = path.slice(validationRoot.length + 1);
    if (["helpers.ts", "loadValidation.ts", "validateTask.ts", "validatorTypes.ts"].includes(relative)) continue;
    assert.match(path, /[\\/]validation[\\/][a-z_]+[\\/]\d{2}[\\/]validator\.ts$/);
  }
  assert.equal(existsSync(join(validationRoot, "choice", "answer-key.json")), true);
});

test("repository empty-folder check ignores generated and reference assets", () => {
  const ignored = new Set([".gaokao", "dist", "node_modules", "reference"]);
  for (const dir of walkDirs(projectRoot)) {
    const relative = dir.slice(projectRoot.length + 1);
    const top = relative.split(/[\\/]/)[0];
    if (ignored.has(top)) continue;
    assert.notEqual(readdirSync(dir).length, 0, `empty folder: ${relative}`);
  }
});

function walk(dir: string, extension: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walk(path, extension));
    if (stat.isFile() && entry.endsWith(extension)) out.push(path);
  }
  return out;
}

function walkDirs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (dir === projectRoot && [".gaokao", "dist", "node_modules", "reference"].includes(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      out.push(path);
      out.push(...walkDirs(path));
    }
  }
  return out;
}
