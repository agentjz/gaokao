import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "order"), ["backup", "deploy_canary", "monitor", "full_rollout"]);
  return {
    passed,
    notes: passed ? [] : ["Safe deployment order is incorrect."],
    evidence: ["Compared submitted order with ordering-02 validator sequence."]
  };
};
