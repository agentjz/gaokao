import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { answerBatch, examStatus, startExam } from "./exam.js";
import { buildReport, reportHtml } from "./report.js";

export function createGaokaoServer() {
  const server = createServer(async (request, response) => {
    try {
      await route(request, response, () => {
        setTimeout(() => {
          if (server.listening) server.close();
        }, 25);
      });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  });
  return server;
}

async function route(request: IncomingMessage, response: ServerResponse, shutdown: () => void): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (request.method === "GET" && url.pathname === "/") return sendHtml(response, homePage());
  if (request.method === "POST" && url.pathname === "/api/exam/start") return sendJson(response, 200, startExam(await readJsonBody(request)));
  if (request.method === "GET" && url.pathname === "/api/exam/status") return sendJson(response, 200, examStatus(required(url, "id")));
  if (request.method === "POST" && url.pathname === "/api/exam/batch-answer") return sendJson(response, 200, await answerBatch(await readJsonBody(request)));
  if (request.method === "GET" && url.pathname === "/report") return sendHtml(response, reportPage(required(url, "id")));
  if (request.method === "POST" && url.pathname === "/api/server/shutdown") {
    sendJson(response, 200, { ok: true, message: "高考本地考务服务正在关闭" });
    shutdown();
    return;
  }
  sendJson(response, 404, { error: "not found" });
}

function required(url: URL, key: string): string {
  const value = url.searchParams.get(key);
  if (!value) throw new Error(`missing ${key}`);
  return value;
}

async function readJsonBody(request: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value, null, 2));
}

function sendHtml(response: ServerResponse, html: string): void {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
}

function homePage(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>高考本地考务服务</title>
  <style>
    body { margin: 0; padding: 32px; font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif; background: #f3efe6; color: #111; }
    main { max-width: 760px; margin: 0 auto; background: #fffdf7; border: 2px solid #111827; padding: 28px; }
    h1 { margin-top: 0; }
    code { background: #eee7d8; padding: 2px 6px; }
  </style>
</head>
<body>
  <main>
    <h1>高考本地考务服务</h1>
    <p>请按 <code>gaokao.md</code> 的考试协议调用本地 API。考试完成后会自动生成本地成绩单文件。</p>
  </main>
</body>
</html>`;
}

function reportPage(examId: string): string {
  return reportHtml(buildReport(examId));
}
