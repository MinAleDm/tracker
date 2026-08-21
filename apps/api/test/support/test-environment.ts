process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-characters";
process.env.JWT_ISSUER = "tracker-api";
process.env.JWT_AUDIENCE = "tracker-web";
process.env.COOKIE_SECURE = "false";
