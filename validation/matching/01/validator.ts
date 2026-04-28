import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  E_CONN_POOL: "database_pool_exhausted",
  HTTP_401_SPIKE: "auth_token_expired",
  CACHE_MISS_SURGE: "cache_warmup_missing"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "matches"), expected);
  return {
    passed,
    notes: passed ? [] : ["Signal-to-cause matches are incorrect."],
    evidence: ["Compared submitted matches with matching-01 validator expectations."]
  };
};
