import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reportsDir } from "./paths.js";
import { loadSession } from "./store.js";
import type { MbtiResult, MbtiSession } from "./types.js";

export interface MbtiReport {
  sessionId: string;
  agentName: string;
  model?: string;
  status: MbtiSession["status"];
  createdAt: string;
  completedAt?: string;
  result: MbtiResult;
}

export function buildReport(sessionId: string): MbtiReport {
  const session = loadSession(sessionId);
  if (!session.result) throw new Error("mbti result not ready");
  return {
    sessionId: session.sessionId,
    agentName: session.agentName,
    model: session.model,
    status: session.status,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    result: session.result
  };
}

export function writeReportFiles(sessionId: string): { html: string; json: string; md: string } {
  const report = buildReport(sessionId);
  const dir = join(reportsDir, sessionId);
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

export function reportHtml(report: MbtiReport): string {
  const dimensionRows = report.result.dimensions
    .map((item) => {
      const leftTotal = item.leftCount + item.rightCount;
      const leftPct = leftTotal === 0 ? 50 : Math.round((item.leftCount / leftTotal) * 100);
      return `<tr><td>${item.pair}</td><td>${item.left}: ${item.leftCount}</td><td><div class="bar"><span style="width:${leftPct}%"></span></div></td><td>${item.right}: ${item.rightCount}</td><td>${item.selected}</td><td>${item.strength}%</td></tr>`;
    })
    .join("");
  const agentItems = report.result.agentProfile.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MBTI Agent Report - ${escapeHtml(report.sessionId)}</title>
  <style>
    body { margin:0; padding:32px; background:#111318; color:#f8fafc; font-family:"Microsoft YaHei", "PingFang SC", system-ui, sans-serif; }
    main { max-width:980px; margin:0 auto; border:1px solid #b08d2f; background:#171a21; padding:30px; box-shadow:0 18px 50px rgba(0,0,0,.35); }
    header { display:flex; justify-content:space-between; gap:24px; border-bottom:1px solid #3f4654; padding-bottom:18px; }
    h1 { margin:0; font-size:34px; }
    .type { color:#d4af37; font-size:54px; font-weight:800; line-height:1; }
    .muted { color:#a7b0c0; }
    section { margin-top:24px; }
    table { width:100%; border-collapse:collapse; }
    th,td { border:1px solid #384152; padding:10px 12px; text-align:left; }
    th { background:#202532; }
    .bar { height:12px; background:#303746; border-radius:999px; overflow:hidden; }
    .bar span { display:block; height:100%; background:linear-gradient(90deg,#d4af37,#8b5cf6); }
    li { margin:8px 0; }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Agent MBTI 报告</h1>
        <div class="muted">考生：${escapeHtml(report.agentName)} ｜ 模型：${escapeHtml(report.model ?? "未填写")} ｜ 完成：${escapeHtml(formatDate(report.completedAt))}</div>
      </div>
      <div class="type">${escapeHtml(report.result.resultType)}</div>
    </header>
    <section>
      <h2>维度倾向</h2>
      <table><thead><tr><th>维度</th><th>左侧</th><th>倾向条</th><th>右侧</th><th>结果</th><th>强度</th></tr></thead><tbody>${dimensionRows}</tbody></table>
    </section>
    <section>
      <h2>Agent 行为画像</h2>
      <ul>${agentItems}</ul>
    </section>
    <section>
      <h2>人格资料</h2>
      <p><strong>${escapeHtml(report.result.profile?.subtitle ?? "未知类型")}</strong></p>
      <p>${escapeHtml(report.result.profile?.description ?? "未找到人格资料。")}</p>
    </section>
  </main>
</body>
</html>`;
}

function reportMarkdown(report: MbtiReport): string {
  const dims = report.result.dimensions.map((item) => `| ${item.pair} | ${item.leftCount} | ${item.rightCount} | ${item.selected} | ${item.strength}% |`).join("\n");
  const profile = report.result.agentProfile.map((item) => `- ${item}`).join("\n");
  return `# Agent MBTI 报告

- 会话：${report.sessionId}
- 考生：${report.agentName}
- 模型：${report.model ?? "未填写"}
- 类型：${report.result.resultType}
- 完成时间：${formatDate(report.completedAt)}

## 维度倾向

| 维度 | 左侧计数 | 右侧计数 | 结果 | 强度 |
| --- | ---: | ---: | --- | ---: |
${dims}

## Agent 行为画像

${profile}

## 人格资料

${report.result.profile?.subtitle ?? "未知类型"}

${report.result.profile?.description ?? "未找到人格资料。"}
`;
}

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "未完成";
}

function escapeHtml(value: unknown): string {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
