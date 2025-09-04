import { apiService } from './api';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  created_at: string;
}

export interface JobStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'STAGED' | 'APPROVED' | 'COMPLETED' | 'FAILED';
  progress?: {
    total: number;
    processed: number;
  };
  errors?: string[];
}

interface StagedDataRow {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  errors: string[] | null;
}

interface StagedDataResponse {
  data: StagedDataRow[];
  validCount: number;
  invalidCount: number;
}

export const pipelineApi = {
  listFiles: async (): Promise<FileInfo[]> => {
    const response = await apiService.get<{ success: boolean; data: { files: FileInfo[] } }>('/api/pipeline/files');
    // The response is wrapped by interceptor: { success, data: { files }, correlationId, timestamp }
    return response.data?.files || [];
  },

  startImport: async (fileId: string): Promise<{ jobId: string; message: string }> => {
    console.log(`[PipelineAPI] Starting import for file: ${fileId}`);
    const response = await apiService.post<{ success: boolean; data: { jobId: string; message: string } }>(`/api/pipeline/import/${fileId}`);
    console.log('[PipelineAPI] Raw response:', response);
    console.log('[PipelineAPI] Response data:', response.data);
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await apiService.get<{ success: boolean; data: JobStatus }>(`/api/pipeline/status/${jobId}`);
    return response.data;
  },

  getStagedData: async (jobId: string): Promise<StagedDataResponse> => {
    const response = await apiService.get<{ success: boolean; data: StagedDataResponse }>(`/api/pipeline/staging/${jobId}`);
    return response.data;
  },

  previewFile: async (fileId: string): Promise<{ data: Record<string, string>[]; columns: string[]; totalRows: number }> => {
    console.log(`[PipelineAPI] Fetching preview for file: ${fileId}`);
    const response = await apiService.get<{ success: boolean; data: { data: Record<string, string>[]; columns: string[]; totalRows: number } }>(`/api/pipeline/preview/${fileId}`);
    console.log('[PipelineAPI] Preview data:', response.data);
    return response.data;
  },

  approveImport: async (jobId: string): Promise<{ message: string; importedCount: number }> => {
    console.log(`[PipelineAPI] Approving import for job: ${jobId}`);
    const response = await apiService.post<{ success: boolean; data: { message: string; importedCount: number } }>(`/api/pipeline/approve/${jobId}`);
    console.log('[PipelineAPI] Approve response:', response);
    return response.data;
  },

  rejectImport: async (jobId: string): Promise<{ message: string; clearedCount: number }> => {
    console.log(`[PipelineAPI] Rejecting import for job: ${jobId}`);
    const response = await apiService.post<{ success: boolean; data: { message: string; clearedCount: number } }>(`/api/pipeline/reject/${jobId}`);
    console.log('[PipelineAPI] Reject response:', response);
    return response.data;
  },

  validateFile: async (fileId: string): Promise<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: string[];
    sampleValidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      mappedData: Record<string, string>;
    }>;
    sampleInvalidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      errors: string[];
    }>;
  }> => {
    console.log(`[PipelineAPI] Validating file: ${fileId}`);
    const response = await apiService.post<{ success: boolean; data: any }>(`/api/pipeline/validate/${fileId}`);
    console.log('[PipelineAPI] Validation response:', response.data);
    return response.data;
  },
};