import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // These are integration tests against a real MongoDB Atlas cluster over the
    // public internet. Vitest's 5s default is generous for a unit test and
    // marginal for a round-trip to Mumbai, which made the suite flaky.
    testTimeout: 30_000,
    hookTimeout: 30_000,

    // Every test file shares one database. Running files in parallel let the
    // auth suite and the tenant-fixture suite interleave their writes, so the
    // files are run one at a time. Tests within a file still run in order.
    fileParallelism: false,
  },
});
