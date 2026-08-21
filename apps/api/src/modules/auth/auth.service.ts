import { createHash, randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import type { AuthSessionDto, AuthTokensDto, LoginDto } from "@tracker/types";
import { UsersService } from "../users/users.service";
import { AuthRepository } from "./auth.repository";

type TokenTtl = `${number}${"ms" | "s" | "m" | "h" | "d" | "w" | "y"}`;

interface RefreshPayload {
  sub: string;
  typ: "refresh";
  sid: string;
}

interface IssuedTokenPair {
  tokens: AuthTokensDto;
  refreshToken: string;
  refreshTokenHash: string;
  refreshExpiresAt: Date;
}

interface IssuedSession extends IssuedTokenPair {
  session: AuthSessionDto;
}

const DURATION_PATTERN = /^\d+(ms|s|m|h|d|w|y)$/;
const DUMMY_PASSWORD_HASH = "$2a$12$HIuEAIdiEOmypimFwSAuBe7HnJbJgB7C1AW5y1dk1mejUeMZ.INDq";

function resolveTokenTtl(duration: string | undefined, fallback: TokenTtl): TokenTtl {
  return duration && DURATION_PATTERN.test(duration) ? (duration as TokenTtl) : fallback;
}

function toExpiryDate(duration: TokenTtl): Date {
  const value = Number.parseInt(duration, 10);
  const multiplier = duration.endsWith("ms")
    ? 1
    : duration.endsWith("s")
      ? 1_000
      : duration.endsWith("m")
        ? 60_000
        : duration.endsWith("h")
          ? 3_600_000
          : duration.endsWith("d")
            ? 86_400_000
            : duration.endsWith("w")
              ? 604_800_000
              : 31_536_000_000;

  return new Date(Date.now() + value * multiplier);
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<IssuedSession> {
    const user = await this.usersService.findByEmail(dto.email.trim().toLowerCase());
    const passwordMatches = await compare(dto.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!user || user.status !== "ACTIVE" || !passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const familyId = randomUUID();
    const issued = await this.issueTokenPair(user.id, familyId);
    await this.authRepository.createRefreshToken({
      userId: user.id,
      familyId,
      tokenHash: issued.refreshTokenHash,
      expiresAt: issued.refreshExpiresAt,
    });

    return {
      ...issued,
      session: {
        user: this.usersService.toUserSummary(user),
        organizations: await this.usersService.listOrganizations(user.id),
        tokens: issued.tokens,
      },
    };
  }

  async refresh(refreshToken: string | null): Promise<IssuedTokenPair> {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh session is missing");
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await this.authRepository.findByTokenHash(tokenHash);

    if (!storedToken || storedToken.userId !== payload.sub || storedToken.familyId !== payload.sid) {
      throw new UnauthorizedException("Invalid refresh session");
    }

    if (storedToken.revokedAt || storedToken.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.revokeFamily(storedToken.userId, storedToken.familyId);
      throw new UnauthorizedException("Refresh token reuse detected");
    }

    const user = await this.usersService.findById(storedToken.userId);
    if (!user || user.status !== "ACTIVE") {
      await this.authRepository.revokeFamily(storedToken.userId, storedToken.familyId);
      throw new UnauthorizedException("User session is no longer active");
    }

    const issued = await this.issueTokenPair(user.id, storedToken.familyId);
    const rotated = await this.authRepository.rotateRefreshToken(storedToken.id, {
      userId: user.id,
      familyId: storedToken.familyId,
      tokenHash: issued.refreshTokenHash,
      expiresAt: issued.refreshExpiresAt,
    });

    if (!rotated) {
      await this.authRepository.revokeFamily(storedToken.userId, storedToken.familyId);
      throw new UnauthorizedException("Refresh token reuse detected");
    }

    return issued;
  }

  async logout(refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const storedToken = await this.authRepository.findByTokenHash(hashRefreshToken(refreshToken));
    if (storedToken) {
      await this.authRepository.revokeFamily(storedToken.userId, storedToken.familyId);
    }
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("User not found");
    }

    return {
      user: this.usersService.toUserSummary(user),
      organizations: await this.usersService.listOrganizations(user.id),
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<RefreshPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        issuer: this.configService.getOrThrow<string>("JWT_ISSUER"),
        audience: this.configService.getOrThrow<string>("JWT_AUDIENCE"),
      });

      if (payload.typ !== "refresh" || !payload.sub || !payload.sid) {
        throw new Error("Invalid refresh token claims");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid refresh session");
    }
  }

  private async issueTokenPair(userId: string, familyId: string): Promise<IssuedTokenPair> {
    const accessTtl = resolveTokenTtl(this.configService.get("JWT_ACCESS_TTL"), "15m");
    const refreshTtl = resolveTokenTtl(this.configService.get("JWT_REFRESH_TTL"), "7d");
    const issuer = this.configService.getOrThrow<string>("JWT_ISSUER");
    const audience = this.configService.getOrThrow<string>("JWT_AUDIENCE");

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, typ: "access" },
        {
          secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
          expiresIn: accessTtl,
          issuer,
          audience,
          jwtid: randomUUID(),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, typ: "refresh", sid: familyId },
        {
          secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
          expiresIn: refreshTtl,
          issuer,
          audience,
          jwtid: randomUUID(),
        },
      ),
    ]);

    return {
      tokens: { accessToken },
      refreshToken,
      refreshTokenHash: hashRefreshToken(refreshToken),
      refreshExpiresAt: toExpiryDate(refreshTtl),
    };
  }
}
