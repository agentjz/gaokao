import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  goal: "restore production checkout",
  priority: "incident fix first",
  defer: "design refresh and framework upgrade"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "fields"), expected);
  return {
    passed,
    notes: passed ? [] : ["Structured fields did not match the required incident triage."],
    evidence: ["Compared submitted structured fields with structured_answer-01 validator expectations."]
  };
};
