import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppExceptionFilter } from './common/filters/app-exception.filter.js';
import { factoryValidacion } from './common/pipes/validation.factory.js';
import { loadSecurityConfig } from './common/security/security.config.js';
import { setupSecurity } from './common/security/setup-security.js';
import { setupSwagger } from './common/swagger/setup-swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupSecurity(app);

  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: factoryValidacion,
    }),
  );

  if (loadSecurityConfig().swaggerEnabled) {
    setupSwagger(app);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

await bootstrap();
