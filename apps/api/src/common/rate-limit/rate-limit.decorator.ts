import { SetMetadata } from "@nestjs/common";

export interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_KEY = "rateLimit";
export const RateLimit = (policy: RateLimitPolicy) => SetMetadata(RATE_LIMIT_KEY, policy);
