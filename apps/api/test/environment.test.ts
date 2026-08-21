import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCorsOrigins, validateEnvironment } from "../src/config/environment";

const validEnvironment = {
  JWT_ACCESS_SECRET: "access-secret-with-more-than-thirty-two-characters",
  JWT_REFRESH_SECRET: "refresh-secret-with-more-than-thirty-two-characters",
  CORS_ORIGIN: "https://tracker.example.com",
};

describe("environment validation", () => {
  it("rejects weak or shared JWT secrets", () => {
    assert.throws(
      () => validateEnvironment({ ...validEnvironment, JWT_ACCESS_SECRET: "replace-me-access" }),
      /at least 32 characters|placeholder/i,
    );
    assert.throws(
      () => validateEnvironment({
        ...validEnvironment,
        JWT_REFRESH_SECRET: validEnvironment.JWT_ACCESS_SECRET,
      }),
      /must be different/i,
    );
  });

  it("rejects wildcard credentialed CORS origins", () => {
    assert.throws(() => parseCorsOrigins("*"), /explicit.*allowlist/i);
  });

  it("normalizes runtime defaults", () => {
    const environment = validateEnvironment(validEnvironment);

    assert.equal(environment.JWT_ISSUER, "tracker-api");
    assert.equal(environment.JWT_AUDIENCE, "tracker-web");
    assert.equal(environment.PORT, "3001");
  });
});
