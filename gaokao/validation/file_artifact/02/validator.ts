import { deepEqual, readJsonArtifact } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  severity: "P1",
  owner: "checkout-oncall",
  action: "disable checkout_v2 flag",
  verification: "error_rate_below_1_percent"
};

export const validate: TaskValidator = ({ taskWorkspace }) => {
  const artifact = readJsonArtifact(taskWorkspace, "incident-triage.json");
  if (!artifact.ok) return { passed: false, notes: [artifact.error], evidence: [`Checked required artifact path: ${artifact.path}`] };
  const passed = deepEqual(artifact.value, expected);
  return {
    passed,
    notes: passed ? [] : ["incident-triage.json exists but content does not match required incident evidence."],
    evidence: [`Read and validated artifact file: ${artifact.path}`]
  };
};
