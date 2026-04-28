import { field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = field(answer, "value") === "region mismatch between api and worker";
  return {
    passed,
    notes: passed ? [] : ["Expected the exact configuration mismatch."],
    evidence: ["Compared submitted value with exact_answer-04 validator expectation."]
  };
};
