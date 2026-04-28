import { getProfile } from "./bank.js";
import type { MbtiAnswer, MbtiLetter, MbtiResult } from "./types.js";

const letters: MbtiLetter[] = ["E", "I", "S", "N", "T", "F", "J", "P"];
const pairs: Array<[MbtiLetter, MbtiLetter]> = [
  ["E", "I"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"]
];

export function buildResult(answers: MbtiAnswer[]): MbtiResult {
  const counts = Object.fromEntries(letters.map((letter) => [letter, 0])) as Record<MbtiLetter, number>;
  for (const answer of answers) counts[answer.value] += 1;

  const dimensions = pairs.map(([left, right]) => {
    const leftCount = counts[left];
    const rightCount = counts[right];
    const selected = leftCount > rightCount ? left : right;
    const total = leftCount + rightCount;
    return {
      pair: `${left}/${right}`,
      left,
      leftCount,
      right,
      rightCount,
      selected,
      strength: total === 0 ? 0 : Math.round((Math.abs(leftCount - rightCount) / total) * 100)
    };
  });

  const resultType = dimensions.map((item) => item.selected).join("");
  return {
    resultType,
    dimensions,
    counts,
    profile: getProfile(resultType),
    agentProfile: buildAgentProfile(resultType)
  };
}

function buildAgentProfile(type: string): string[] {
  const out: string[] = [];
  out.push(type.includes("E") ? "更偏主动外放：遇到任务时倾向先互动、先对齐、先推进。" : "更偏内收审慎：遇到任务时倾向先观察、先整理、再输出。");
  out.push(type.includes("N") ? "更偏抽象和可能性：擅长从目标、模式和长期方向理解任务。" : "更偏事实和细节：擅长从现有材料、明确证据和具体步骤推进任务。");
  out.push(type.includes("T") ? "更偏逻辑决策：遇到冲突时倾向按规则、因果和证据判断。" : "更偏关系决策：遇到冲突时更关注用户感受、协作状态和表达方式。");
  out.push(type.includes("J") ? "更偏计划收敛：倾向快速定路径、按步骤完成并交付结果。" : "更偏开放探索：倾向保留选项、适应变化并持续调整路径。");
  return out;
}
