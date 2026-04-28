import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  backup: "snapshot_before_migration",
  dryRun: "run migration in staging",
  rollback: "restore_snapshot"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "fields"), expected);
  return {
    passed,
    notes: passed ? [] : ["Structured migration safety fields are incorrect."],
    evidence: ["Compared submitted fields with structured_answer-05 validator expectation."]
  };
};
