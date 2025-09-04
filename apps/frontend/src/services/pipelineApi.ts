import { apiService } from './api';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  created_at: string;
}

export interface JobStatus {
  id: string;
  status: string;
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
};