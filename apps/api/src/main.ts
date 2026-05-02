import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "https://app.acquavivastrategic.it",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Backend Nest attivo sulla porta ${port}`);
}

bootstrap();