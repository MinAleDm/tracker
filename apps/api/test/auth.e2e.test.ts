import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import supertest from "supertest";
import { createTestApp } from "./support/test-app";

describe("auth flow", () => {
  const appsToClose = new Set<Awaited<ReturnType<typeof createTestApp>>>();

  afterEach(async () => {
    for (const context of appsToClose) {
      await context.app.close();
    }

    appsToClose.clear();
  });

  it("rotates refresh tokens and revokes the previous refresh token", async () => {
    const context = await createTestApp();
    appsToClose.add(context);

    const request = supertest(context.app.getHttpServer());
    const agent = supertest.agent(context.app.getHttpServer());

    const loginResponse = await agent.post("/api/v1/auth/login").send({
      email: "owner@tracker.local",
      password: "changeme123",
    });

    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.user.email, "owner@tracker.local");
    assert.equal(loginResponse.body.organizations.length, 1);

    assert.equal(loginResponse.body.tokens.refreshToken, undefined);
    const firstCookie = (loginResponse.headers["set-cookie"] as unknown as string[])[0]?.split(";", 1)[0];
    assert.ok(firstCookie?.startsWith("tracker_refresh="));

    const refreshResponse = await agent.post("/api/v1/auth/refresh");

    assert.equal(refreshResponse.status, 200);
    assert.equal(refreshResponse.body.refreshToken, undefined);
    assert.ok(refreshResponse.body.accessToken);

    const revokedRefreshResponse = await request
      .post("/api/v1/auth/refresh")
      .set("Cookie", firstCookie!);

    assert.equal(revokedRefreshResponse.status, 401);

    const revokedFamilyResponse = await agent.post("/api/v1/auth/refresh");
    assert.equal(revokedFamilyResponse.status, 401);

    const meResponse = await request
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${refreshResponse.body.accessToken as string}`);

    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.body.user.name, "Tracker Owner");
  });

  it("keeps protected routes private by default", async () => {
    const context = await createTestApp();
    appsToClose.add(context);

    const response = await supertest(context.app.getHttpServer()).get("/api/v1/organizations");

    assert.equal(response.status, 401);
  });

  it("rate limits repeated authentication attempts", async () => {
    const context = await createTestApp();
    appsToClose.add(context);
    const request = supertest(context.app.getHttpServer());

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request.post("/api/v1/auth/login").send({});
      assert.equal(response.status, 400);
    }

    const limitedResponse = await request.post("/api/v1/auth/login").send({});
    assert.equal(limitedResponse.status, 429);
    assert.ok(limitedResponse.headers["retry-after"]);
  });
});
