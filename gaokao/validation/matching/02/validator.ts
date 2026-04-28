import { deepEqual, field } from "../../helpers.js";
import type { TaskValidator } from "../../validatorTypes.js";

const expected = {
  p95_latency: "slow_dependency",
  five_xx_spike: "backend_exception",
  queue_depth_growth: "worker_saturation"
};

export const validate: TaskValidator = ({ answer }) => {
  const passed = deepEqual(field(answer, "matches"), expected);
  return {
    passed,
    notes: passed ? [] : ["Metric-to-bottleneck matches are incorrect."],
    evidence: ["Compared submitted matches with matching-02 validator expectations."]
  };
};
