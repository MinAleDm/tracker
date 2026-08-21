import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

interface NewRefreshToken {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  createRefreshToken(input: NewRefreshToken) {
    return this.prisma.refreshToken.create({ data: input });
  }

  findByTokenHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  rotateRefreshToken(tokenId: string, nextToken: NewRefreshToken) {
    return this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.refreshToken.updateMany({
        where: {
          id: tokenId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
          replacedByTokenHash: nextToken.tokenHash,
        },
      });

      if (revoked.count !== 1) {
        return false;
      }

      await transaction.refreshToken.create({ data: nextToken });
      return true;
    });
  }

  async revokeFamily(userId: string, familyId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
