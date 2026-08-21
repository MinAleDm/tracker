import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string, organizationId: string) {
    return this.prisma.project.findMany({
      where: {
        organizationId,
        organization: {
          memberships: {
            some: { userId },
          },
        },
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  create(data: { organizationId: string; key: string; name: string; description?: string }) {
    return this.prisma.project.create({
      data,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }

  async canAccessOrganization(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    return Boolean(membership);
  }

  findAccessibleById(projectId: string, userId: string) {
    return this.prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          memberships: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });
  }
}
