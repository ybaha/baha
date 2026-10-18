import { execSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { userInfo } from "node:os";

import { assertLoopbackDatabaseUrl } from "./loopback-db.cjs";

export async function startLoopbackPostgres() {
  const port = Number(
    execSync(
      `python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()'`,
    )
      .toString()
      .trim(),
  );
  const dataDir = `/tmp/baha-server-pg-${port}`;
  const env = { ...process.env, PGDATA: dataDir };
  const run = (cmd) => execSync(cmd, { stdio: "pipe", env });
  try {
    run(`initdb -D "${dataDir}" --auth=trust`);
    // Linux packages default to a postgres-owned socket directory that CI cannot write.
    run(
      `pg_ctl -D "${dataDir}" -o "-h 127.0.0.1 -p ${port} -k ${dataDir}" -l "${dataDir}/log" -w start`,
    );
    run(`createdb -h 127.0.0.1 -p ${port} baha_server_test`);
  } catch (error) {
    let log = "";
    try { log = readFileSync(`${dataDir}/log`, "utf8").slice(-4000); } catch {}
    try { run(`pg_ctl -D "${dataDir}" -m immediate -w stop`); } catch {}
    rmSync(dataDir, { recursive: true, force: true });
    throw new Error(`Disposable PostgreSQL failed to start. ${log}`, { cause: error });
  }
  const databaseUrl = `postgresql://${userInfo().username}@127.0.0.1:${port}/baha_server_test`;
  assertLoopbackDatabaseUrl(databaseUrl);
  return {
    port,
    dataDir,
    databaseUrl,
    async stop() {
      try {
        run(`pg_ctl -D "${dataDir}" -m fast -w stop`);
      } catch {
        // ignore
      }
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}
