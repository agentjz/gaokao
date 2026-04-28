import { field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = field(answer, "value") === "worker saturation";
  return {
    passed,
    notes: passed ? [] : ["Expected the exact bottleneck phrase."],
    evidence: ["Compared submitted value with exact_answer-05 validator expectation."]
  };
};
