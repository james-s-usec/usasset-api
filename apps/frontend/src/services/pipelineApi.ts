import { apiService } from './api';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  created_at: string;
}

export interface JobStatus {
  status: string;
  progress?: {
    total: number;
    processed: number;
  };
}

export const pipelineApi = {
  listFiles: async (): Promise<FileInfo[]> => {
    const response = await apiService.get<{ success: boolean; data: { files: FileInfo[] } }>('/api/pipeline/files');
    // The response is wrapped by interceptor: { success, data: { files }, correlationId, timestamp }
    return response.data?.files || [];
  },

  startImport: async (fileId: string): Promise<{ jobId: string; message: string }> => {
    const response = await apiService.post<{ jobId: string; message: string }>(`/api/pipeline/import/${fileId}`);
    return response;
  },

  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await apiService.get<JobStatus>(`/api/pipeline/status/${jobId}`);
    return response;
  },
};