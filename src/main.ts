import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RespuestaInterceptor } from './comunes/interceptores/respuesta.interceptor';
import { FiltroExcepcionesHttp } from './comunes/filtros/filtro-excepciones-http';
import helmet from 'helmet';
import compression from 'compression';
import './config/timezone.config'; // ← Antes de todo

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validaciones globales (evita errores futuros)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new RespuestaInterceptor());
  app.useGlobalFilters(new FiltroExcepcionesHttp());
  app.use(helmet());
  app.use(compression());

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Thunder/Postman
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS: Origen no permitido'), false);
    },
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ API corriendo en http://localhost:${port}`);

}
bootstrap();
