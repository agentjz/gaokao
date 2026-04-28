import { deepEqual, readJsonArtifact } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  title: "2026-04-28 release summary",
  fixed: "checkout-submit mobile unresponsive",
  verification: "mobile-e2e-checkout",
  risk: "payment regression"
};

export const validate: TaskValidator = ({ taskWorkspace }) => {
  const artifact = readJsonArtifact(taskWorkspace, "release-summary.json");
  if (!artifact.ok) {
    return {
      passed: false,
      notes: [artifact.error],
      evidence: [`Checked required artifact path: ${artifact.path}`]
    };
  }

  const passed = deepEqual(artifact.value, expected);
  return {
    passed,
    notes: passed ? [] : ["release-summary.json exists but its JSON content does not match the required release evidence."],
    evidence: [`Read and validated artifact file: ${artifact.path}`]
  };
};
