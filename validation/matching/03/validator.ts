import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  login_401: "expired_token",
  checkout_409: "duplicate_idempotency_key",
  upload_413: "payload_too_large"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "matches"), expected);
  return {
    passed,
    notes: passed ? [] : ["HTTP signal matches are incorrect."],
    evidence: ["Compared submitted matches with matching-03 validator expectations."]
  };
};
