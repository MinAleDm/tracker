import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import supertest from "supertest";
import { createTestApp } from "./support/test-app";

describe("health flow", () => {
  const appsToClose = new Set<Awaited<ReturnType<typeof createTestApp>>>();

  afterEach(async () => {
    for (const context of appsToClose) {
      await context.app.close();
    }

    appsToClose.clear();
  });

  it("reports live and ready status", async () => {
    const context = await createTestApp();
    appsToClose.add(context);

    const request = supertest(context.app.getHttpServer());

    const liveResponse = await request.get("/api/health/live");
    assert.equal(liveResponse.status, 200);
    assert.equal(liveResponse.body.status, "ok");
    assert.equal(liveResponse.body.checks.api, "ok");

    const readyResponse = await request.get("/api/health/ready");
    assert.equal(readyResponse.status, 200);
    assert.equal(readyResponse.body.status, "ok");
    assert.equal(readyResponse.body.checks.database, "ok");
    assert.equal(readyResponse.body.checks.redis, "ok");
  });
});

