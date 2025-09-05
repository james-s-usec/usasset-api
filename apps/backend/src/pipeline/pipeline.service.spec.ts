import { Test, TestingModule } from '@nestjs/testing';
import { PipelineService } from './pipeline.service';
import { AzureBlobStorageService } from '../files/services/azure-blob-storage.service';
import { CsvParserService } from './services/csv-parser.service';
import { PipelineRepository } from './repositories/pipeline.repository';
import { PipelineJobService } from './services/pipeline-job.service';
import { PipelineValidationService } from './services/pipeline-validation.service';
import { PipelineImportService } from './services/pipeline-import.service';
import { RuleEngineService } from './services/rule-engine.service';

describe('PipelineService', () => {
  let service: PipelineService;

  // Split beforeEach into smaller setup functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockProviders = (): any[] => [
    PipelineService,
    { provide: AzureBlobStorageService, useValue: {} },
    { provide: CsvParserService, useValue: {} },
    {
      provide: PipelineRepository,
      useValue: { getPrismaClient: jest.fn() },
    },
    { provide: PipelineJobService, useValue: {} },
    { provide: PipelineValidationService, useValue: {} },
    { provide: PipelineImportService, useValue: {} },
    { provide: RuleEngineService, useValue: {} },
  ];

  const setupTestModule = async (): Promise<TestingModule> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: createMockProviders(),
    }).compile();
    return module;
  };

  beforeEach(async () => {
    const module = await setupTestModule();
    service = module.get<PipelineService>(PipelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
