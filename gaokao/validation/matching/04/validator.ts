import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  "package.json": "node_metadata",
  Dockerfile: "container_build",
  "tsconfig.json": "typescript_config"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "matches"), expected);
  return {
    passed,
    notes: passed ? [] : ["Project file purpose matches are incorrect."],
    evidence: ["Compared submitted matches with matching-04 validator expectations."]
  };
};
