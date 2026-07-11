import { Controller, Get, HttpCode, ServiceUnavailableException } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("live")
  live() {
    return this.healthService.live();
  }

  @Get("ready")
  @HttpCode(200)
  async ready() {
    const result = await this.healthService.ready();

    if (result.status === "error") {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}

