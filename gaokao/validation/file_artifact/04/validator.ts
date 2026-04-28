import { deepEqual, readJsonArtifact } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  table: "users",
  backup: "snapshot_before_migration",
  dryRun: true,
  rollback: "restore_snapshot"
};

export const validate: TaskValidator = ({ taskWorkspace }) => {
  const artifact = readJsonArtifact(taskWorkspace, "migration-plan.json");
  if (!artifact.ok) return { passed: false, notes: [artifact.error], evidence: [`Checked required artifact path: ${artifact.path}`] };
  const passed = deepEqual(artifact.value, expected);
  return {
    passed,
    notes: passed ? [] : ["migration-plan.json exists but content does not match required migration evidence."],
    evidence: [`Read and validated artifact file: ${artifact.path}`]
  };
};
