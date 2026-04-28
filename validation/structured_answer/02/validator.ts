import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  severity: "P1",
  owner: "checkout-oncall",
  mitigation: "disable checkout_v2 flag"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "fields"), expected);
  return {
    passed,
    notes: passed ? [] : ["Structured incident triage fields are incorrect."],
    evidence: ["Compared submitted fields with structured_answer-02 validator expectation."]
  };
};
