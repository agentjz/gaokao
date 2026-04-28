import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "order"), ["detect", "mitigate", "verify", "postmortem"]);
  return {
    passed,
    notes: passed ? [] : ["Incident response order is incorrect."],
    evidence: ["Compared submitted order with ordering-01 validator sequence."]
  };
};
