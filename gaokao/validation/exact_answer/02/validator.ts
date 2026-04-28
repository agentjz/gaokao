import { field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = field(answer, "value") === "disable checkout_v2 flag";
  return {
    passed,
    notes: passed ? [] : ["Expected the exact mitigation phrase."],
    evidence: ["Compared submitted value with exact_answer-02 validator expectation."]
  };
};
