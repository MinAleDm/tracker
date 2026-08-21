import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { parseCorsOrigins } from "./config/environment";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: parseCorsOrigins(configService.get("CORS_ORIGIN")),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
    maxAge: 600,
  });

  const trustProxyHops = Number(configService.get("TRUST_PROXY_HOPS") ?? 0);
  if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
    app.getHttpAdapter().getInstance().set("trust proxy", trustProxyHops);
  }

  app.use(helmet());
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (configService.get("SWAGGER_ENABLED") === "true") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Tracker API")
      .setDescription("Task tracking platform API")
      .setVersion("1.0.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  app.enableShutdownHooks();

  const port = Number(configService.getOrThrow("PORT"));
  await app.listen(port);
}

void bootstrap();
