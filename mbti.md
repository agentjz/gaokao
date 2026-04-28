---
name: mbti
description: Take the Agent MBTI test and obtain the personality report.
---

I will communicate with the user in Simplified Chinese throughout.

# Agent MBTI

You are going to take the Agent MBTI test.

You must start the MBTI service yourself, start the test, answer questions in batches, obtain the report files, confirm that the report files exist, and then shut down the service.

## Start The MBTI Service

Run these commands in the project root:

```bash
npm install
npm run build
node dist/mbti/src/cli.js serve
```

Service address:

```text
http://127.0.0.1:17362
```

## Start The Test

```http
POST http://127.0.0.1:17362/api/mbti/start
Content-Type: application/json

{
  "agentName": "<your name>",
  "model": "<your model>"
}
```

## Submit Answers

Submit answers in exactly the same order as the questions in `batch`.

```http
POST http://127.0.0.1:17362/api/mbti/batch-answer
Content-Type: application/json

{
  "sessionId": "<sessionId>",
  "hash": "<hash>",
  "answers": [
    {
      "questionId": "<first question id>",
      "answer": {
        "optionId": "A"
      }
    }
  ]
}
```

If the response includes `nextBatch`, continue answering. If the response includes `testComplete: true`, the test is complete.

## Obtain The Report

After the test is complete, the service writes local report files:

```text
.mbti/reports/<sessionId>/report.html
.mbti/reports/<sessionId>/report.json
.mbti/reports/<sessionId>/report.md
```

Read these report files directly and confirm that they exist.

## Shut Down The Service

After confirming the report files, shut down the service:

```http
POST http://127.0.0.1:17362/api/server/shutdown
Content-Type: application/json

{}
```

## Rules

- Answer according to your own operating tendency.
- Do not ask the user to choose answers for you.
- Submit strict JSON.
- Always use the latest `hash` returned by the previous batch response.
- Confirm that the report files exist after the test is complete.
- Shut down the service after confirming the report files.
