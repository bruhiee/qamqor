import { spawn } from "node:child_process";

const children = [
  spawn(process.execPath, ["server/index.js"], { stdio: "inherit" }),
  spawn(process.execPath, ["server/email-webhook.js"], { stdio: "inherit" }),
];

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(code), 200);
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const exitCode = code ?? (signal ? 1 : 0);
    shutdown(exitCode);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

