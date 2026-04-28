import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  decision: "block launch",
  blocker: "unresolved P1 data-loss bug",
  owner: "release-captain"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "fields"), expected);
  return {
    passed,
    notes: passed ? [] : ["Structured launch decision fields are incorrect."],
    evidence: ["Compared submitted fields with structured_answer-03 validator expectation."]
  };
};
