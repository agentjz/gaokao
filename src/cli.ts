#!/usr/bin/env node
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createGaokaoServer } from "./server.js";
import { projectRoot } from "./paths.js";

const command = process.argv[2] ?? "serve";
const pidFile = join(projectRoot, ".gaokao-server.pid");

if (command !== "serve") {
  console.error("unknown command");
  process.exitCode = 1;
} else {
  const port = Number(process.env.GAOKAO_PORT ?? 17361);
  const server = createGaokaoServer();

  server.listen(port, "127.0.0.1", () => {
    writeFileSync(pidFile, `${process.pid}\n`, "utf8");
    console.log(`高考本地考务服务已启动：http://127.0.0.1:${port}`);
  });

  server.on("close", () => {
    if (existsSync(pidFile)) unlinkSync(pidFile);
  });

  process.on("SIGINT", () => server.close(() => process.exit(0)));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}
