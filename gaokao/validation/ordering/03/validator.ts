import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "order"), ["reproduce", "inspect_logs", "isolate_change", "patch", "verify"]);
  return {
    passed,
    notes: passed ? [] : ["Debugging sequence is incorrect."],
    evidence: ["Compared submitted order with ordering-03 validator sequence."]
  };
};
