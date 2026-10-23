import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './database';

describe('OpenAPI document', () => {
  it('includes all API operations under the versioned prefix', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    const app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('SENAI FC API')
        .setVersion('1.0.0')
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
    });
    await app.init();

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/api/v1/players',
        '/api/v1/players/{id}',
        '/api/v1/players/{id}/condition',
        '/api/v1/players/{id}/buy',
        '/api/v1/players/{id}/sell',
        '/api/v1/clubs',
        '/api/v1/clubs/{id}/lineup',
        '/api/v1/clubs/{id}/transactions',
        '/api/v1/clubs/{id}/transactions/export',
        '/api/v1/matches',
        '/api/v1/matches/{id}',
        '/api/v1/standings',
      ]),
    );

    await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    await request(app.getHttpServer()).get('/api/docs').expect(200);

    await app.close();
  });
});
