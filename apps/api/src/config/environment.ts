const MINIMUM_SECRET_LENGTH = 32;

function requireSecret(config: Record<string, unknown>, key: string): string {
  const value = config[key];

  if (typeof value !== "string" || value.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(`${key} must contain at least ${MINIMUM_SECRET_LENGTH} characters`);
  }

  if (/^(replace-me|changeme|secret|password)/i.test(value)) {
    throw new Error(`${key} uses a forbidden placeholder value`);
  }

  return value;
}

export function parseCorsOrigins(value: string | undefined): string[] {
  const origins = (value ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0 || origins.includes("*")) {
    throw new Error("CORS_ORIGIN must be an explicit comma-separated allowlist");
  }

  for (const origin of origins) {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error(`CORS_ORIGIN contains an invalid origin: ${origin}`);
    }
  }

  return origins;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const accessSecret = requireSecret(config, "JWT_ACCESS_SECRET");
  const refreshSecret = requireSecret(config, "JWT_REFRESH_SECRET");

  if (accessSecret === refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
  }

  parseCorsOrigins(typeof config.CORS_ORIGIN === "string" ? config.CORS_ORIGIN : undefined);

  const port = Number(config.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return {
    ...config,
    PORT: String(port),
    JWT_ISSUER: config.JWT_ISSUER ?? "tracker-api",
    JWT_AUDIENCE: config.JWT_AUDIENCE ?? "tracker-web",
    COOKIE_SECURE: config.COOKIE_SECURE ?? (config.NODE_ENV === "production" ? "true" : "false"),
    SWAGGER_ENABLED: config.SWAGGER_ENABLED ?? (config.NODE_ENV === "production" ? "false" : "true"),
  };
}
