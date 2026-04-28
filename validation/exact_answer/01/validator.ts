import { field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const value = field(answer, "value");
  const passed = value === "payment-core connection pool exhausted";
  return {
    passed,
    notes: passed ? [] : ["Expected the exact root cause phrase."],
    evidence: ["Compared submitted value with the exact machine answer for exact_answer-01."]
  };
};
