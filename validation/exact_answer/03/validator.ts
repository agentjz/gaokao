import { field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = field(answer, "value") === "expired billing service token";
  return {
    passed,
    notes: passed ? [] : ["Expected the exact authentication root cause."],
    evidence: ["Compared submitted value with exact_answer-03 validator expectation."]
  };
};
