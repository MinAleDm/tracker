import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
import { parseCorsOrigins } from "../../config/environment";
import { ProjectsService } from "../projects/projects.service";
import { UsersService } from "../users/users.service";

@WebSocketGateway({
  namespace: "/tasks",
  cors: {
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
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
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token as string | undefined;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string; typ?: string }>(token, {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
        issuer: this.configService.getOrThrow<string>("JWT_ISSUER"),
        audience: this.configService.getOrThrow<string>("JWT_AUDIENCE"),
      });

      if (!payload.sub || payload.typ !== "access") {
        throw new Error("Invalid access token claims");
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== "ACTIVE") {
        throw new Error("User session is no longer active");
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
