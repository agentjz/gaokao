# Gaokao Project Operating Constitution

Always communicate with the project owner in Simplified Chinese.

The owner is a product manager, not the person reviewing line-by-line implementation. The owner cares about how users take the exam, whether the exam is fair, whether scores are trustworthy, what the report looks like, where the risks are, and how the result is verified. Do not explain code internals, schemas, file walkthroughs, logs, or implementation details unless explicitly asked.

## 0. Project Nature

Gaokao is a fast-evolving, aggressive local examination system for evaluating real AI agent capability.

The final user experience is: a user registers `gaokao.md` into any agent and asks it to read the Gaokao skill and take the exam. The agent finds the project, starts the local exam service, receives tasks, submits answers or required artifacts, obtains local report files, and shuts the service down after completion.

This is not a chat toy, a leaderboard wrapper, or a plugin for one specific agent. It must become a long-lived, extensible, multi-maintainer examination infrastructure that different agents can use.

## 1. Highest Standard

Work to the highest engineering standard by default.

Do not write temporary architecture, hardcoded answers, fake data, empty directories, half-migrated files, dead compatibility, stale residue, or examples that teach future maintainers the wrong design. If a new truth is stronger than the old design, delete the old design cleanly.

A task is complete only when:

- The current product truth is clear.
- The user experience is complete.
- Examiner and candidate boundaries are clear.
- Tasks, validation, scoring, and reports have clear ownership.
- Docs, code, and tests agree.
- Automatable verification has been run.
- No delivery-impacting tail remains.

## 2. Owner Communication

Default to the user-review perspective, not the engineer-review perspective.

Prefer explaining:

- What the user will see.
- How the agent takes the exam.
- How fairness is protected.
- How the score is produced.
- How the owner can judge whether it is correct.
- Current risks and decision points.

Avoid explaining:

- How a function is implemented.
- What every file does line by line.
- Full schemas.
- Long command output.
- Long plans about what you will do next.

Do not use implementation details as the delivery explanation unless the owner asks for them.

## 3. Docs-Driven And Tests-Driven

Gaokao is developed through docs-driven and tests-driven work.

After receiving a formal task, understand the current spec, project shape, real runtime behavior, and accepted direction before implementation. When behavior changes, encode acceptance criteria as tests or equivalent verification first, then implement. Before closeout, specs, implementation, tests, and reports must converge.

Do not rely on guesses, vibes, or “close enough”. Rely on docs, tests, implementation, verification, and final consistency.

## 4. Examiner And Candidate Boundary

The platform is the examiner. The candidate agent is the examinee.

The candidate may only see public exam papers, public materials, public APIs, and the exam protocol. The candidate must not see hidden answers, validation rules, scoring implementation, private fixtures, historical truth, or traces from other candidates.

The platform owns:

- Public exam papers.
- Machine-side validation.
- Scoring rules.
- Isolated environments.
- Evidence records.
- Score reports.

The candidate owns:

- Understanding tasks.
- Choosing actions.
- Calling its own tools.
- Submitting answers or artifacts.

The platform must not become the candidate's brain. It only provides the exam environment, records evidence, and scores results.

## 5. Task Bank Discipline

The task bank must be a real exam asset, not packaging around fake tests.

Public tasks live in `tasks/`. Machine-side validation lives in `validation/`. Scoring logic lives in `scoring/`. Report generation lives in the report layer. Do not put answers in public prompts. Do not hardcode question IDs and answers in scoring code.

Task directories are organized by validation mechanism, not by capability label. Capabilities such as execution, retrieval, reasoning, and communication are task metadata for reporting. The directory shape is `tasks/<validationType>/<number>/task.json`. Choice tasks use a shared choice answer key. Non-choice tasks use one validator per numbered task at `validation/<validationType>/<number>/validator.ts`.

When adding task types or task assets, make them data assets and formal contracts instead of prompt prose or temporary code.

Choice questions are a strong base type, but easy grading is not the same as sufficient capability evaluation. To evaluate real execution, use state checks, file artifact checks, API state checks, browser state checks, or exact-answer checks.

## 6. Architecture Discipline

One file should do one thing, but do not split for theater.

Good structure is not about having many files. It is about clear responsibility, low coupling, high cohesion, and stable change cost. A module is clean only if its responsibility and non-responsibility can be stated plainly.

Core boundaries:

- `tasks/`: public exam papers and public materials.
- `validation/`: machine-side truth and validation data.
- `scoring/`: general grading strategies.
- `src/`: service, exam flow, state, reports, and access surfaces.
- `tests/`: product contracts and architecture boundaries.

Do not leave empty directories, stale paths, obsolete formats, dead concepts, or residue that teaches future maintainers the wrong design.

## 7. Real Execution And Objective Scoring

Scores come only from evidence observed by the platform, not from candidate self-report.

Prefer deterministic grading:

- Choice answer keys.
- Exact answers.
- File artifact checks.
- API state checks.
- Data state checks.
- Browser state checks.
- Execution traces and evidence records.

Do not use LLM judges when machine grading is practical. If judge-based scoring is unavoidable, label it clearly as weaker evidence.

## 8. Local Exam Experience

Gaokao is a local exam.

The service may call real APIs, but the delivery experience must be locally runnable, locally verifiable, and locally report-producing. Local reports should be written to:

```text
.gaokao/reports/<examId>/report.html
.gaokao/reports/<examId>/report.json
.gaokao/reports/<examId>/report.md
```

After the exam completes, the agent must obtain the report files and shut down the local exam service. Do not leave the service running in the background.

## 9. Fast Evolution

Gaokao does not pursue backward compatibility by default.

When a new structure is stronger, replace the old one. Do not keep old task formats, scoring branches, adapter aliases, docs, tests, prompts, or compatibility shims unless the owner explicitly asks for a temporary bridge.

Expected path:

`new truth -> update spec -> update tests -> replace implementation -> delete old residue -> verify a real local exam path`

## 10. Verification And Closeout

Writing files is not completion.

Completion requires real evidence:

- Relevant files updated.
- Old residue removed.
- Key tests updated.
- Build and tests run.
- Real local exam path verified when behavior changes.
- Report files generated.
- Service can shut down correctly.

Final replies should be short: what changed, what was verified, and what risk remains. Do not substitute product results with code details.

## 11. Final Rule

Always push Gaokao toward the strongest current exam architecture.

If something weakens fairness, leaks answers, creates fake tests, pollutes the user experience, favors one agent, hides evidence, preserves dead compatibility, or makes future maintenance harder, remove it.

If something improves real exams, fair isolation, objective scoring, evidence quality, local experience, owner understanding, or long-term maintainability, build it cleanly and verify it.
