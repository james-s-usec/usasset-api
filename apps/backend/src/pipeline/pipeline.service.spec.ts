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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineService,
        {
          provide: AzureBlobStorageService,
          useValue: {},
        },
        {
          provide: CsvParserService,
          useValue: {},
        },
        {
          provide: PipelineRepository,
          useValue: {
            getPrismaClient: jest.fn(),
          },
        },
        {
          provide: PipelineJobService,
          useValue: {},
        },
        {
          provide: PipelineValidationService,
          useValue: {},
        },
        {
          provide: PipelineImportService,
          useValue: {},
        },
        {
          provide: RuleEngineService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PipelineService>(PipelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
