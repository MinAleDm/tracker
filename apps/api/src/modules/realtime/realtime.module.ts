import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ProjectsModule } from "../projects/projects.module";
import { UsersModule } from "../users/users.module";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";

@Module({
  imports: [JwtModule.register({}), ProjectsModule, UsersModule],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
