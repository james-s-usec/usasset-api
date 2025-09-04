import { Injectable } from '@nestjs/common';
import { AzureBlobStorageService } from '../files/services/azure-blob-storage.service';

interface FileInfo {
  id: string;
  name: string;
  size: number;
  created_at: Date;
}

interface JobStatus {
  status: string;
  progress?: {
    total: number;
    processed: number;
  };
}

@Injectable()
export class PipelineService {
  public constructor(
    private readonly blobStorageService: AzureBlobStorageService,
  ) {}

  public async listCsvFiles(): Promise<FileInfo[]> {
    // Use the same approach as the files page - get all files and filter
    const MAX_FILES = 100;
    const result = await this.blobStorageService.findMany(1, MAX_FILES);

    // Filter for CSV files - check file extension in original_name (most reliable)
    const csvFiles = result.files.filter(
      (file) => file.original_name?.toLowerCase().endsWith('.csv')
    );

    return csvFiles.map((file) => ({
      id: file.id,
      name: file.original_name,
      size: file.size,
      created_at: file.created_at,
    }));
  }

  public startImport(fileId: string): Promise<string> {
    // Mock implementation - generate a job ID
    const jobId = `job-${Date.now()}-${fileId}`;

    // In Phase 1, this will just return the job ID
    // Later phases will implement actual processing
    return Promise.resolve(jobId);
  }

  public getJobStatus(): Promise<JobStatus> {
    // Mock implementation - return completed status
    // jobId parameter will be used in later phases for actual job tracking
    return Promise.resolve({
      status: 'COMPLETED',
      progress: {
        total: 100,
        processed: 100,
      },
    });
  }
}
