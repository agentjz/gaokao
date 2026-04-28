import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "order"), ["contain", "preserve_evidence", "notify_owner", "remediate", "review"]);
  return {
    passed,
    notes: passed ? [] : ["Data incident response order is incorrect."],
    evidence: ["Compared submitted order with ordering-04 validator sequence."]
  };
};
