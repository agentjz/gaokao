import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createMbtiServer } from "../mbti/src/server.js";

test("local mbti service runs complete personality test flow", async () => {
  const server = createMbtiServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;

  try {
    const start = await post(`${base}/api/mbti/start`, { agentName: "test-agent", model: "test-model" });
    assert.ok(start.sessionId);
    assert.equal(start.batch.length, 6);
    assert.equal(start.totalQuestions, 93);

    let hash = start.hash;
    let batch = start.batch;
    let completed = false;
    let finalResponse: any;

    while (!completed) {
      const response = await post(`${base}/api/mbti/batch-answer`, {
        sessionId: start.sessionId,
        hash,
        answers: batch.map((question: any) => ({ questionId: question.id, answer: { optionId: "A" } }))
      });
      completed = response.testComplete === true;
      finalResponse = response;
      hash = response.hash;
      batch = response.nextBatch;
      if (!completed) {
        assert.ok(batch.length > 0);
        assert.ok(batch.length <= 6);
      }
    }

    assert.match(finalResponse.resultType, /^[EISNTFJP]{4}$/);
    assert.ok(finalResponse.reportFiles.html);
    assert.ok(finalResponse.reportFiles.json);
    assert.ok(finalResponse.reportFiles.md);
    assert.equal(existsSync(finalResponse.reportFiles.html), true);
    assert.equal(existsSync(finalResponse.reportFiles.json), true);
    assert.equal(existsSync(finalResponse.reportFiles.md), true);
    assert.match(readFileSync(finalResponse.reportFiles.html, "utf8"), /Agent MBTI 报告/);

    const reportJson = JSON.parse(readFileSync(finalResponse.reportFiles.json, "utf8"));
    assert.equal(reportJson.result.resultType, finalResponse.resultType);
    assert.equal(reportJson.result.dimensions.length, 4);

    const report = await fetch(`${base}/report?id=${start.sessionId}`);
    assert.equal(report.status, 200);
    assert.match(await report.text(), /Agent MBTI 报告/);

    const shutdown = await post(`${base}/api/server/shutdown`, {});
    assert.equal(shutdown.ok, true);
  } finally {
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

async function post(url: string, body: unknown): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  assert.equal(response.status, 200, text);
  return JSON.parse(text);
}
