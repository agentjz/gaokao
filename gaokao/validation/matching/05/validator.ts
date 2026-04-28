import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  customer_says_unstable: "reliability",
  engineer_says_no_tests: "verification",
  manager_says_deadline: "schedule_risk"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "matches"), expected);
  return {
    passed,
    notes: passed ? [] : ["Stakeholder need matches are incorrect."],
    evidence: ["Compared submitted matches with matching-05 validator expectations."]
  };
};
