import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "order"), ["clarify_goal", "define_scope", "implement", "verify", "report"]);
  return {
    passed,
    notes: passed ? [] : ["Feature delivery order is incorrect."],
    evidence: ["Compared submitted order with ordering-05 validator sequence."]
  };
};
