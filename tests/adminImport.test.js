import test from "node:test";
import assert from "node:assert/strict";
import { assertTestTarget, createImportPlan, runCatalogImport } from "../scripts/importCatalogs.js";

const safeEnv = {
  VITE_FULLHEAD_ENV: "next-testing",
  FULLHEAD_ENV: "next-testing",
  VITE_FIREBASE_PROJECT_ID: "fullhead---next",
};

test("admin import plan validates all initial catalogs before authentication", async () => {
  const plan = await createImportPlan();
  assert.deepEqual(
    Object.fromEntries(["presets", "huds", "configs", "treinos"].map((kind) => [kind, plan.filter((item) => item.kind === kind).length])),
    { presets: 18, huds: 18, configs: 18, treinos: 4 },
  );
  assert.equal(plan.length, 58);
  assert.equal(new Set(plan.map((item) => `${item.kind}/${item.id}`)).size, 58);
});

test("admin import accepts only the isolated Next project and environment", () => {
  assert.doesNotThrow(() => assertTestTarget(safeEnv));
  for (const env of [
    { ...safeEnv, VITE_FIREBASE_PROJECT_ID: "panelfreefire-f90aa" },
    { ...safeEnv, VITE_FIREBASE_PROJECT_ID: "another-test" },
    { ...safeEnv, VITE_FULLHEAD_ENV: "production" },
    { ...safeEnv, FULLHEAD_ENV: undefined },
  ]) assert.throws(() => assertTestTarget(env), /Importación bloqueada/);
});

test("dry-run needs no admin credential and write needs explicit project confirmation", async () => {
  const result = await runCatalogImport({ argv: [], env: safeEnv });
  assert.deepEqual(result, {
    mode: "dry-run",
    counts: { presets: 18, huds: 18, configs: 18, treinos: 4 },
    total: 58,
  });
  await assert.rejects(
    runCatalogImport({ argv: ["--write"], env: safeEnv }),
    /--confirm-project=fullhead---next/,
  );
});
