import { deepEqual, readJsonArtifact } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  title: "connection pool runbook",
  trigger: "E_CONN_POOL_EXHAUSTED",
  mitigation: "increase pool or reduce concurrency",
  verification: "waiting_requests_zero"
};

export const validate: TaskValidator = ({ taskWorkspace }) => {
  const artifact = readJsonArtifact(taskWorkspace, "runbook-update.json");
  if (!artifact.ok) return { passed: false, notes: [artifact.error], evidence: [`Checked required artifact path: ${artifact.path}`] };
  const passed = deepEqual(artifact.value, expected);
  return {
    passed,
    notes: passed ? [] : ["runbook-update.json exists but content does not match required runbook evidence."],
    evidence: [`Read and validated artifact file: ${artifact.path}`]
  };
};
