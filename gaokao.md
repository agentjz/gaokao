---
name: gaokao
description: Take Gaokao and obtain the exam report.
---

I will communicate with the user in Simplified Chinese throughout.

# Gaokao

You are going to take Gaokao.

You must start the exam service yourself, start the exam, answer questions in batches, submit answers, obtain the report files, confirm that the report files exist, and then shut down the exam service.

## Start The Exam Service

Run these commands in the Gaokao project directory:

```bash
npm install
npm run build
node dist/src/cli.js serve
```

Service address:

```text
http://127.0.0.1:17361
```

## Start The Exam

```http
POST http://127.0.0.1:17361/api/exam/start
Content-Type: application/json

{
  "agentName": "<your name>",
  "model": "<your model>"
}
```

The response includes:

- `examId`: the exam id.
- `hash`: the current batch submission token.
- `batch`: the current questions.
- `totalQuestions`: the total number of questions.

## Submit Answers

Submit answers in exactly the same order as the questions in `batch`.

```http
POST http://127.0.0.1:17361/api/exam/batch-answer
Content-Type: application/json

{
  "examId": "<examId>",
  "hash": "<hash>",
  "answers": [
    {
      "questionId": "<first question id>",
      "answer": {
        "optionIds": ["A"]
      }
    },
    {
      "questionId": "<second question id>",
      "answer": {
        "optionIds": ["B", "D"]
      }
    }
  ]
}
```

If the response includes `nextBatch`, continue answering the next batch. If the response includes `examComplete: true`, the exam is complete.

Supported deterministic question types:

- `choice`: submit one or more option ids with `optionIds`; follow the question's `choiceMode`.
- `exact_answer`: submit `value`.
- `structured_answer`: submit `fields`.
- `ordering`: submit `order`.
- `matching`: submit `matches`.
- `file_artifact`: create the required file in the task workspace, then submit the requested artifact reference.

## Obtain The Report

After the exam is complete, the service writes local report files:

```text
.gaokao/reports/<examId>/report.html
.gaokao/reports/<examId>/report.json
.gaokao/reports/<examId>/report.md
```

The final API response includes `reportFiles` with absolute local paths for all three report files. Read these files directly and confirm that they exist.

## Shut Down The Exam Service

After obtaining the report files and confirming that they exist, shut down the exam service:

```http
POST http://127.0.0.1:17361/api/server/shutdown
Content-Type: application/json

{}
```

## Rules

- Do not skip questions.
- Do not fake the report or score.
- Do not ask the user to answer questions for you.
- Submit strict JSON.
- Always use the latest `hash` returned by the previous batch response.
- Confirm that the report files exist after the exam is complete.
- Shut down the exam service after confirming the report files.
