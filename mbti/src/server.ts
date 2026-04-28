import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { answerMbtiBatch, mbtiStatus, startMbti } from "./session.js";
import { buildReport, reportHtml } from "./report.js";

export function createMbtiServer() {
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
  if (request.method === "POST" && url.pathname === "/api/mbti/start") return sendJson(response, 200, startMbti(await readJsonBody(request)));
  if (request.method === "GET" && url.pathname === "/api/mbti/status") return sendJson(response, 200, mbtiStatus(required(url, "id")));
  if (request.method === "POST" && url.pathname === "/api/mbti/batch-answer") return sendJson(response, 200, answerMbtiBatch(await readJsonBody(request)));
  if (request.method === "GET" && url.pathname === "/report") return sendHtml(response, reportHtml(buildReport(required(url, "id"))));
  if (request.method === "POST" && url.pathname === "/api/server/shutdown") {
    sendJson(response, 200, { ok: true, message: "MBTI service is shutting down" });
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
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>Agent MBTI</title></head><body><main><h1>Agent MBTI</h1><p>Read mbti.md and follow the local test protocol.</p></main></body></html>`;
}
