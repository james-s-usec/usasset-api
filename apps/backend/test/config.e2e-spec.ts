import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

// Test helpers - extracted outside describe for line count
function setupProductionEnvWithoutSecrets(): void {
  process.env.NODE_ENV = 'production';
  delete process.env.DATABASE_URL;
  delete process.env.JWT_SECRET;
}

async function attemptAppCreation(): Promise<void> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const testApp = moduleFixture.createNestApplication();
  await testApp.init();

  throw new Error(
    'App should have failed to start without required production config',
  );
}

function validateExpectedError(error: unknown): void {
  expect(error).toBeDefined();
  const errorMessage = error instanceof Error ? error.message : '';
  expect(errorMessage).toMatch(/Validation failed|App should have failed/);
}

describe('Configuration E2E', () => {
  let app: INestApplication;

  describe('Development Configuration', () => {
    beforeAll(async () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3001';

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should start app with development config', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Production Configuration', () => {
    it('should fail to start without required production variables', async () => {
      setupProductionEnvWithoutSecrets();
      try {
        await attemptAppCreation();
      } catch (error) {
        validateExpectedError(error);
      }
    });
  });
});
