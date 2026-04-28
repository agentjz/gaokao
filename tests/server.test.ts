import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createGaokaoServer } from "../gaokao/src/server.js";
import { loadChoiceAnswer } from "../gaokao/validation/loadValidation.js";

test("local gaokao server runs complete exam flow", async () => {
  const server = createGaokaoServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;

  try {
    const start = await post(`${base}/api/gaokao/start`, { agentName: "test-agent", model: "test-model" });
    assert.ok(start.examId);
    assert.equal(start.batch.length, 2);
    assert.equal(start.totalQuestions, 18);

    let hash = start.hash;
    let batch = start.batch;
    let completed = false;
    let finalResponse: any;

    while (!completed) {
      const response = await post(`${base}/api/gaokao/batch-answer`, {
        examId: start.examId,
        hash,
        answers: batch.map((question: any) => ({ questionId: question.id, answer: answerFor(question) }))
      });
      completed = response.examComplete === true;
      finalResponse = response;
      hash = response.hash;
      batch = response.nextBatch;
      if (!completed) {
        assert.ok(batch.length > 0);
        assert.ok(batch.length <= 2);
      }
    }

    assert.ok(finalResponse.reportFiles.html);
    assert.ok(finalResponse.reportFiles.json);
    assert.ok(finalResponse.reportFiles.md);
    assert.equal(existsSync(finalResponse.reportFiles.html), true);
    assert.equal(existsSync(finalResponse.reportFiles.json), true);
    assert.equal(existsSync(finalResponse.reportFiles.md), true);
    assert.match(readFileSync(finalResponse.reportFiles.html, "utf8"), /高考成绩单/);

    const reportJson = JSON.parse(readFileSync(finalResponse.reportFiles.json, "utf8"));
    assert.equal(reportJson.score, 100);
    assert.equal(reportJson.grade, "S");
    for (const item of Object.values(reportJson.byType) as any[]) {
      assert.equal(item.total, 3);
    }

    const report = await fetch(`${base}/report?id=${start.examId}`);
    assert.equal(report.status, 200);
    assert.match(await report.text(), /高考成绩单/);

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

function answerFor(question: any): Record<string, unknown> {
  if (question.type === "choice") return { optionIds: loadChoiceAnswer(question.id).optionIds };
  if (exactAnswers[question.id]) return { value: exactAnswers[question.id] };
  if (structuredAnswers[question.id]) return { fields: structuredAnswers[question.id] };
  if (orderingAnswers[question.id]) return { order: orderingAnswers[question.id] };
  if (matchingAnswers[question.id]) return { matches: matchingAnswers[question.id] };
  if (artifactAnswers[question.id]) return writeArtifact(question, artifactAnswers[question.id]);
  throw new Error(`unsupported test question: ${question.id}`);
}

const exactAnswers: Record<string, string> = {
  "exact_answer-01": "payment-core connection pool exhausted",
  "exact_answer-02": "disable checkout_v2 flag",
  "exact_answer-03": "expired billing service token",
  "exact_answer-04": "region mismatch between api and worker",
  "exact_answer-05": "worker saturation"
};

const structuredAnswers: Record<string, Record<string, unknown>> = {
  "structured_answer-01": {
    goal: "restore production checkout",
    priority: "incident fix first",
    defer: "design refresh and framework upgrade"
  },
  "structured_answer-02": {
    severity: "P1",
    owner: "checkout-oncall",
    mitigation: "disable checkout_v2 flag"
  },
  "structured_answer-03": {
    decision: "block launch",
    blocker: "unresolved P1 data-loss bug",
    owner: "release-captain"
  },
  "structured_answer-04": {
    acknowledge: "invoice failures are blocking the customer",
    action: "investigate billing error logs",
    followUp: "send status update by end of day"
  },
  "structured_answer-05": {
    backup: "snapshot_before_migration",
    dryRun: "run migration in staging",
    rollback: "restore_snapshot"
  }
};

const orderingAnswers: Record<string, string[]> = {
  "ordering-01": ["detect", "mitigate", "verify", "postmortem"],
  "ordering-02": ["backup", "deploy_canary", "monitor", "full_rollout"],
  "ordering-03": ["reproduce", "inspect_logs", "isolate_change", "patch", "verify"],
  "ordering-04": ["contain", "preserve_evidence", "notify_owner", "remediate", "review"],
  "ordering-05": ["clarify_goal", "define_scope", "implement", "verify", "report"]
};

const matchingAnswers: Record<string, Record<string, string>> = {
  "matching-01": {
    E_CONN_POOL: "database_pool_exhausted",
    HTTP_401_SPIKE: "auth_token_expired",
    CACHE_MISS_SURGE: "cache_warmup_missing"
  },
  "matching-02": {
    p95_latency: "slow_dependency",
    five_xx_spike: "backend_exception",
    queue_depth_growth: "worker_saturation"
  },
  "matching-03": {
    login_401: "expired_token",
    checkout_409: "duplicate_idempotency_key",
    upload_413: "payload_too_large"
  },
  "matching-04": {
    "package.json": "node_metadata",
    Dockerfile: "container_build",
    "tsconfig.json": "typescript_config"
  },
  "matching-05": {
    customer_says_unstable: "reliability",
    engineer_says_no_tests: "verification",
    manager_says_deadline: "schedule_risk"
  }
};

const artifactAnswers: Record<string, { fileName: string; value: Record<string, unknown> }> = {
  "file_artifact-01": {
    fileName: "release-summary.json",
    value: {
      title: "2026-04-28 release summary",
      fixed: "checkout-submit mobile unresponsive",
      verification: "mobile-e2e-checkout",
      risk: "payment regression"
    }
  },
  "file_artifact-02": {
    fileName: "incident-triage.json",
    value: {
      severity: "P1",
      owner: "checkout-oncall",
      action: "disable checkout_v2 flag",
      verification: "error_rate_below_1_percent"
    }
  },
  "file_artifact-03": {
    fileName: "api-health.json",
    value: {
      endpoint: "/api/payments",
      status: "healthy",
      p95Ms: 180,
      checkedAt: "2026-04-28T10:00:00Z"
    }
  },
  "file_artifact-04": {
    fileName: "migration-plan.json",
    value: {
      table: "users",
      backup: "snapshot_before_migration",
      dryRun: true,
      rollback: "restore_snapshot"
    }
  },
  "file_artifact-05": {
    fileName: "runbook-update.json",
    value: {
      title: "connection pool runbook",
      trigger: "E_CONN_POOL_EXHAUSTED",
      mitigation: "increase pool or reduce concurrency",
      verification: "waiting_requests_zero"
    }
  }
};

function writeArtifact(question: any, artifact: { fileName: string; value: Record<string, unknown> }): Record<string, unknown> {
  const artifactPath = join(question.workspace.task, artifact.fileName);
  mkdirSync(question.workspace.task, { recursive: true });
  writeFileSync(artifactPath, `${JSON.stringify(artifact.value, null, 2)}\n`, "utf8");
  return { artifactPath: artifact.fileName };
}
