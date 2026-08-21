import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import type { RealtimeTaskEventDto } from "@tracker/types";
import { ProjectsService } from "../projects/projects.service";

function resolveCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

@WebSocketGateway({
  namespace: "/tasks",
  cors: {
    origin: resolveCorsOrigins(),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly projectsService: ProjectsService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token as string | undefined;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const secret = process.env.JWT_ACCESS_SECRET;

      if (!secret) {
        throw new Error("JWT access secret is not configured");
      }

      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token, {
        secret,
      });

      if (!payload.sub) {
        throw new Error("JWT subject is missing");
      }

      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage("project:subscribe")
  async subscribeProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: unknown) {
    const userId = client.data.userId as string | undefined;

    if (!userId || typeof projectId !== "string" || projectId.length === 0 || projectId.length > 128) {
      throw new WsException("Invalid project subscription");
    }

    const canAccessProject = await this.projectsService.canAccessProject(userId, projectId);

    if (!canAccessProject) {
      throw new WsException("Project access denied");
    }

    await Promise.all(
      [...client.rooms]
        .filter((room) => room.startsWith("project:"))
        .map((room) => client.leave(room)),
    );

    void client.join(`project:${projectId}`);
    return { subscribed: projectId };
  }

  emitTaskEvent(event: RealtimeTaskEventDto) {
    this.server.to(`project:${event.projectId}`).emit("task:changed", event);
  }
}
