import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../modules/users/users.service";
import type { RequestUser } from "./request-user";

interface AccessTokenPayload {
  sub: string;
  typ: "access";
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      issuer: configService.getOrThrow<string>("JWT_ISSUER"),
      audience: configService.getOrThrow<string>("JWT_AUDIENCE"),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<RequestUser> {
    if (payload.typ !== "access" || !payload.sub) {
      throw new UnauthorizedException("Invalid access token");
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("User session is no longer active");
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
