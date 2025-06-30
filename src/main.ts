import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // const config = new DocumentBuilder()
  //   .setTitle('U2E')
  //   .setVersion('0.0.1')
  //   .setDescription('U2E developer API docs.')
  //   .addBearerAuth({
  //     type: 'http',
  //     description:
  //       'Access token to perform authenticated and authorized actions.',
  //   })
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('docs', app, document, {
  //   customSiteTitle: 'U2E',
  //   swaggerOptions: { defaultModelsExpandDepth: -1 },
  // });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = parseInt(process.env.PORT);

  await app.listen(port);
}
bootstrap();
