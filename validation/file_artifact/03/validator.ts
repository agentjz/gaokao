import { deepEqual, readJsonArtifact } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  endpoint: "/api/payments",
  status: "healthy",
  p95Ms: 180,
  checkedAt: "2026-04-28T10:00:00Z"
};

export const validate: TaskValidator = ({ taskWorkspace }) => {
  const artifact = readJsonArtifact(taskWorkspace, "api-health.json");
  if (!artifact.ok) return { passed: false, notes: [artifact.error], evidence: [`Checked required artifact path: ${artifact.path}`] };
  const passed = deepEqual(artifact.value, expected);
  return {
    passed,
    notes: passed ? [] : ["api-health.json exists but content does not match required health evidence."],
    evidence: [`Read and validated artifact file: ${artifact.path}`]
  };
};
