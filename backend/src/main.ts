import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Validação global estrita de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true,  // Lança erro 400 se enviarem campos extras não permitidos
      transform: true,            // Transforma automaticamente os tipos do payload (ex: string -> number)
    }),
  );

  // 2. Configuração explícita de CORS para o Frontend (React + Vite na porta 5173)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`API do Backend inicializada com sucesso na porta ${port}`);
}

bootstrap();
