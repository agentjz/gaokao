import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reportsDir } from "./paths.js";
import { loadSession } from "./store.js";
import { gradeLetter } from "../scoring/gradePolicy.js";
import type { ExamSession } from "./types.js";

export interface ExamReport {
  examId: string;
  agentName: string;
  model?: string;
  status: ExamSession["status"];
  createdAt: string;
  completedAt?: string;
  score: number;
  grade: string;
  passed: number;
  total: number;
  bySkill: Record<string, { score: number; passed: number; total: number }>;
  byType: Record<string, { score: number; passed: number; total: number }>;
  session: ExamSession;
}

export interface ReportFiles {
  html: string;
  json: string;
  md: string;
}

const skillNames: Record<string, string> = {
  understanding: "理解",
  execution: "执行",
  retrieval: "检索",
  reasoning: "推理",
  reflection: "反思",
  tooling: "工具",
  eq: "沟通",
  memory: "记忆"
};

export function buildReport(examId: string): ExamReport {
  const session = loadSession(examId);
  const total = session.results.length;
  const score = total === 0 ? 0 : Math.round(session.results.reduce((sum, result) => sum + result.score, 0) / total);
  const bySkill: Record<string, { score: number; passed: number; total: number }> = {};
  const byType: Record<string, { score: number; passed: number; total: number }> = {};

  for (const result of session.results) {
    byType[result.type] ??= { score: 0, passed: 0, total: 0 };
    byType[result.type].score += result.score;
    byType[result.type].total += 1;
    if (result.passed) byType[result.type].passed += 1;

    for (const skill of result.skills) {
      bySkill[skill] ??= { score: 0, passed: 0, total: 0 };
      bySkill[skill].score += result.score;
      bySkill[skill].total += 1;
      if (result.passed) bySkill[skill].passed += 1;
    }
  }

  for (const item of [...Object.values(bySkill), ...Object.values(byType)]) {
    item.score = item.total === 0 ? 0 : Math.round(item.score / item.total);
  }

  return {
    examId: session.examId,
    agentName: session.agentName,
    model: session.model,
    status: session.status,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    score,
    grade: gradeLetter(score),
    passed: session.results.filter((result) => result.passed).length,
    total,
    bySkill,
    byType,
    session
  };
}

export function writeReportFiles(examId: string): ReportFiles {
  const report = buildReport(examId);
  const dir = join(reportsDir, examId);
  mkdirSync(dir, { recursive: true });

  const files = {
    html: join(dir, "report.html"),
    json: join(dir, "report.json"),
    md: join(dir, "report.md")
  };

  writeFileSync(files.json, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(files.md, reportMarkdown(report), "utf8");
  writeFileSync(files.html, reportHtml(report), "utf8");
  return files;
}

export function reportHtml(report: ExamReport): string {
  const skillRows = Object.entries(report.bySkill)
    .map(([skill, item]) => `<tr><td>${escapeHtml(skillNames[skill] ?? skill)}</td><td>${item.score}</td><td>${item.passed}/${item.total}</td></tr>`)
    .join("");
  const typeRows = Object.entries(report.byType)
    .map(([type, item]) => `<tr><td>${escapeHtml(type)}</td><td>${item.score}</td><td>${item.passed}/${item.total}</td></tr>`)
    .join("");
  const resultRows = report.session.results
    .map((result, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(result.questionId)}</td><td>${escapeHtml(result.type)}</td><td>${escapeHtml(result.skills.map((skill) => skillNames[skill] ?? skill).join("、"))}</td><td>${result.score}</td><td>${result.passed ? "通过" : "未通过"}</td><td>${escapeHtml(result.notes.length ? result.notes.join("；") : "证据命中评分标准")}</td></tr>`)
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>高考成绩单 - ${escapeHtml(report.examId)}</title>
  <style>
    :root { color-scheme: light; --ink:#111; --muted:#5f6368; --line:#1f2937; --paper:#fffdf7; --seal:#b42318; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; background: #e9e5da; color: var(--ink); font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", system-ui, sans-serif; }
    main { max-width: 980px; margin: 0 auto; background: var(--paper); border: 2px solid var(--line); padding: 28px 34px 36px; box-shadow: 0 12px 30px rgba(0,0,0,.12); }
    header { display: grid; grid-template-columns: 1fr auto; gap: 24px; border-bottom: 2px solid var(--line); padding-bottom: 18px; align-items: end; }
    h1 { margin: 0 0 8px; font-size: 34px; letter-spacing: 0; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 28px; color: var(--muted); font-size: 14px; }
    .scoreBox { width: 176px; height: 132px; border: 3px solid var(--seal); color: var(--seal); display: grid; place-items: center; text-align: center; transform: rotate(-2deg); }
    .scoreBox strong { display: block; font-size: 44px; line-height: 1; }
    .scoreBox span { display: block; margin-top: 8px; font-weight: 700; }
    section { margin-top: 24px; }
    h2 { margin: 0 0 10px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,.45); }
    th, td { border: 1px solid #2f3742; padding: 10px 12px; text-align: left; vertical-align: top; font-size: 14px; }
    th { background: #f0eadc; font-weight: 700; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--line); }
    .summary div { padding: 14px; border-right: 1px solid var(--line); }
    .summary div:last-child { border-right: 0; }
    .summary span { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .summary strong { font-size: 22px; }
    footer { margin-top: 28px; color: var(--muted); font-size: 13px; border-top: 1px solid var(--line); padding-top: 12px; }
    @media print { body { background: white; padding: 0; } main { box-shadow: none; border: 2px solid #000; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>高考成绩单</h1>
        <div class="meta">
          <div>准考证号：${escapeHtml(report.examId)}</div>
          <div>考生：${escapeHtml(report.agentName)}</div>
          <div>模型：${escapeHtml(report.model ?? "未填写")}</div>
          <div>完成时间：${escapeHtml(formatDate(report.completedAt))}</div>
        </div>
      </div>
      <div class="scoreBox"><div><strong>${report.score}</strong><span>${escapeHtml(report.grade)} 等</span></div></div>
    </header>

    <section class="summary">
      <div><span>总分</span><strong>${report.score}/100</strong></div>
      <div><span>等级</span><strong>${escapeHtml(report.grade)}</strong></div>
      <div><span>通过题数</span><strong>${report.passed}/${report.total}</strong></div>
      <div><span>考试状态</span><strong>${report.status === "completed" ? "已完成" : "进行中"}</strong></div>
    </section>

    <section>
      <h2>能力成绩</h2>
      <table>
        <thead><tr><th>能力</th><th>得分</th><th>通过</th></tr></thead>
        <tbody>${skillRows}</tbody>
      </table>
    </section>

    <section>
      <h2>验证类型成绩</h2>
      <table>
        <thead><tr><th>验证类型</th><th>得分</th><th>通过</th></tr></thead>
        <tbody>${typeRows}</tbody>
      </table>
    </section>

    <section>
      <h2>逐题成绩</h2>
      <table>
        <thead><tr><th>序号</th><th>题号</th><th>验证类型</th><th>能力</th><th>得分</th><th>结果</th><th>说明</th></tr></thead>
        <tbody>${resultRows}</tbody>
      </table>
    </section>

    <footer>本成绩单由高考本地考务服务生成。评分依据为本次考试保存的提交记录和服务端评分结果。</footer>
  </main>
</body>
</html>`;
}

function reportMarkdown(report: ExamReport): string {
  const skillRows = Object.entries(report.bySkill)
    .map(([skill, item]) => `| ${skillNames[skill] ?? skill} | ${item.score} | ${item.passed}/${item.total} |`)
    .join("\n");
  const typeRows = Object.entries(report.byType)
    .map(([type, item]) => `| ${type} | ${item.score} | ${item.passed}/${item.total} |`)
    .join("\n");
  const resultRows = report.session.results
    .map((result, index) => `| ${index + 1} | ${result.questionId} | ${result.type} | ${result.skills.map((skill) => skillNames[skill] ?? skill).join("、")} | ${result.score} | ${result.passed ? "通过" : "未通过"} | ${result.notes.length ? result.notes.join("；") : "证据命中评分标准"} |`)
    .join("\n");

  return `# 高考成绩单

- 准考证号：${report.examId}
- 考生：${report.agentName}
- 模型：${report.model ?? "未填写"}
- 完成时间：${formatDate(report.completedAt)}
- 总分：${report.score}/100
- 等级：${report.grade}
- 通过题数：${report.passed}/${report.total}

## 能力成绩

| 能力 | 得分 | 通过 |
| --- | ---: | ---: |
${skillRows}

## 验证类型成绩

| 验证类型 | 得分 | 通过 |
| --- | ---: | ---: |
${typeRows}

## 逐题成绩

| 序号 | 题号 | 验证类型 | 能力 | 得分 | 结果 | 说明 |
| ---: | --- | --- | --- | ---: | --- | --- |
${resultRows}
`;
}

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "未完成";
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
