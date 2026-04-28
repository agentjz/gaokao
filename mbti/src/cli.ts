#!/usr/bin/env node
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createMbtiServer } from "./server.js";

const command = process.argv[2] ?? "serve";
const pidFile = join(resolve(".".trim()), ".mbti-server.pid");

if (command !== "serve") {
  console.error("unknown command");
  process.exitCode = 1;
} else {
  const port = Number(process.env.MBTI_PORT ?? 17362);
  const server = createMbtiServer();

  server.listen(port, "127.0.0.1", () => {
    writeFileSync(pidFile, `${process.pid}\n`, "utf8");
    console.log(`Agent MBTI service started: http://127.0.0.1:${port}`);
  });

  server.on("close", () => {
    if (existsSync(pidFile)) unlinkSync(pidFile);
  });

  process.on("SIGINT", () => server.close(() => process.exit(0)));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}
