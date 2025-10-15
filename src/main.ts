import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Вмикаємо CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3009',
    'http://91.239.235.132:3009',
    'https://mira-notes.site',
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  app.use(cookieParser()); // <- додаємо це
  await app.listen(process.env.PORT ?? 5004);
}
bootstrap();
