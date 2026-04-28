import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  acknowledge: "invoice failures are blocking the customer",
  action: "investigate billing error logs",
  followUp: "send status update by end of day"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "fields"), expected);
  return {
    passed,
    notes: passed ? [] : ["Structured escalation response fields are incorrect."],
    evidence: ["Compared submitted fields with structured_answer-04 validator expectation."]
  };
};
